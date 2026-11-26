import { randomInt } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { isValidCpf, onlyDigits } from '../../lib/cpf.js';
import { AppError, notFound } from '../../lib/errors.js';
import { pageMeta } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import type { CustomerInput } from './customers.schema.js';

export async function list(opts: { page: number; pageSize: number; search?: string }) {
  const where: Prisma.CustomerWhereInput = opts.search
    ? {
        OR: [
          { name: { contains: opts.search, mode: 'insensitive' } },
          { phone: { contains: opts.search } },
          { vehicles: { some: { plate: { contains: opts.search.toUpperCase() } } } },
        ],
      }
    : {};
  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      include: { _count: { select: { vehicles: true } }, access: { select: { updatedAt: true } } },
    }),
    prisma.customer.count({ where }),
  ]);
  return { data, meta: pageMeta(opts.page, opts.pageSize, total) };
}

export async function getById(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id }, include: { vehicles: true, access: { select: { updatedAt: true } } } });
  if (!customer) throw notFound('Cliente');
  return customer;
}

/** CPF (11 dígitos válidos) ou CNPJ (14 dígitos). Guarda só os dígitos para o acesso do cliente por documento. */
function documentDigits(document?: string | null): string | null {
  const digits = onlyDigits(document ?? '');
  if (!digits) return null;
  if ((digits.length === 11 && isValidCpf(digits)) || digits.length === 14) return digits;
  throw new AppError(400, 'CPF/CNPJ inválido', 'document');
}

export const create = (input: CustomerInput) =>
  prisma.customer.create({ data: { ...input, documentDigits: documentDigits(input.document) } });

const assertNotAnonymized = (c: { anonymizedAt: Date | null }) => {
  if (c.anonymizedAt) throw new AppError(409, 'Os dados deste cliente foram anonimizados');
};

export async function update(id: string, input: CustomerInput) {
  assertNotAnonymized(await getById(id));
  return prisma.customer.update({ where: { id }, data: { ...input, documentDigits: documentDigits(input.document) } });
}

/** Gera um novo código de acesso (6 dígitos). Só é devolvido aqui, uma vez; no banco fica apenas o hash. */
export async function generateAccessPin(id: string) {
  assertNotAnonymized(await getById(id));
  const pin = String(randomInt(100000, 1000000));
  const pinHash = await bcrypt.hash(pin, 10);
  await prisma.customerAccess.upsert({
    where: { customerId: id },
    create: { customerId: id, pinHash },
    // Novo código encerra as sessões abertas com o anterior
    update: { pinHash, pinIssuedAt: new Date(), failedAttempts: 0, lockedUntil: null },
  });
  return { pin };
}

export async function revokeAccess(id: string) {
  await getById(id);
  await prisma.customerAccess.deleteMany({ where: { customerId: id } });
}

export const ANONYMIZED_NAME = 'Cliente anonimizado';

/** Apaga nome, documento e contatos, encerra o acesso do cliente e os links públicos. Não pode ser desfeito. */
export async function anonymize(id: string) {
  assertNotAnonymized(await getById(id));
  await prisma.$transaction([
    prisma.customer.update({
      where: { id },
      data: { name: ANONYMIZED_NAME, document: null, documentDigits: null, phone: null, email: null, notes: null, anonymizedAt: new Date() },
    }),
    prisma.customerAccess.deleteMany({ where: { customerId: id } }),
    prisma.serviceOrder.updateMany({
      where: { vehicle: { customerId: id }, publicToken: { not: null } },
      data: { publicToken: null, publicTokenExpiresAt: null },
    }),
  ]);
  return getById(id);
}
