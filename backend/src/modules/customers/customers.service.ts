import type { Prisma } from '@prisma/client';
import { notFound } from '../../lib/errors.js';
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
      include: { _count: { select: { vehicles: true } } },
    }),
    prisma.customer.count({ where }),
  ]);
  return { data, meta: pageMeta(opts.page, opts.pageSize, total) };
}

export async function getById(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id }, include: { vehicles: true } });
  if (!customer) throw notFound('Cliente');
  return customer;
}

export const create = (input: CustomerInput) => prisma.customer.create({ data: input });

export async function update(id: string, input: CustomerInput) {
  await getById(id);
  return prisma.customer.update({ where: { id }, data: input });
}
