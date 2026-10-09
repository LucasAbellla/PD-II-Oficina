import type { Prisma } from '@prisma/client';
import { AppError, notFound } from '../../lib/errors.js';
import { pageMeta } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import type { VehicleInput } from './vehicles.schema.js';

export async function list(opts: { page: number; pageSize: number; search?: string; customerId?: string }) {
  const where: Prisma.VehicleWhereInput = {
    ...(opts.customerId ? { customerId: opts.customerId } : {}),
    ...(opts.search
      ? {
          OR: [
            { plate: { contains: opts.search.toUpperCase() } },
            { model: { contains: opts.search, mode: 'insensitive' } },
            { brand: { contains: opts.search, mode: 'insensitive' } },
            { customer: { name: { contains: opts.search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
  const [data, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { plate: 'asc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      include: { customer: { select: { id: true, name: true } } },
    }),
    prisma.vehicle.count({ where }),
  ]);
  return { data, meta: pageMeta(opts.page, opts.pageSize, total) };
}

export async function getById(id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id }, include: { customer: true } });
  if (!vehicle) throw notFound('Veículo');
  return vehicle;
}

async function assertCustomerExists(customerId: string) {
  const exists = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } });
  if (!exists) throw new AppError(400, 'Cliente informado não existe');
}

export async function create(input: VehicleInput) {
  await assertCustomerExists(input.customerId);
  return prisma.vehicle.create({ data: input });
}

export async function update(id: string, input: VehicleInput) {
  await getById(id);
  await assertCustomerExists(input.customerId);
  return prisma.vehicle.update({ where: { id }, data: input });
}

/** RF08 — histórico de OS (com serviços realizados) de um veículo. */
export async function history(id: string) {
  const vehicle = await getById(id);
  const orders = await prisma.serviceOrder.findMany({
    where: { vehicleId: id },
    orderBy: { openedAt: 'desc' },
    include: { items: { orderBy: { performedAt: 'asc' } } },
  });
  return { vehicle, orders };
}
