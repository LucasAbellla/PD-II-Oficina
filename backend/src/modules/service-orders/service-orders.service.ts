import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { AppError, notFound } from '../../lib/errors.js';
import { pageMeta } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import type { createOrderSchema, itemSchema, orderListQuery } from './service-orders.schema.js';
import { allowedTransitions, canTransition, isClosed, type OrderStatus } from './status.js';

const fullInclude = {
  vehicle: { include: { customer: { select: { id: true, name: true, phone: true } } } },
  items: { orderBy: { performedAt: 'asc' } },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.ServiceOrderInclude;

export async function list(opts: z.infer<typeof orderListQuery>) {
  const where: Prisma.ServiceOrderWhereInput = {
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.vehicleId ? { vehicleId: opts.vehicleId } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.serviceOrder.findMany({
      where,
      orderBy: { number: 'desc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      include: { vehicle: { select: { id: true, plate: true, brand: true, model: true, customer: { select: { name: true } } } } },
    }),
    prisma.serviceOrder.count({ where }),
  ]);
  return { data, meta: pageMeta(opts.page, opts.pageSize, total) };
}

async function getRaw(id: string) {
  const order = await prisma.serviceOrder.findUnique({ where: { id }, include: fullInclude });
  if (!order) throw notFound('Ordem de serviço');
  return order;
}

export async function getById(id: string) {
  const order = await getRaw(id);
  return { ...order, allowedTransitions: allowedTransitions(order.status) };
}

export async function create(input: z.infer<typeof createOrderSchema>, userId: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId }, select: { id: true } });
  if (!vehicle) throw new AppError(400, 'Veículo informado não existe');
  return prisma.serviceOrder.create({ data: { ...input, createdById: userId } });
}

export async function changeStatus(id: string, to: OrderStatus) {
  const order = await getRaw(id);
  if (!canTransition(order.status, to)) {
    throw new AppError(409, `Transição de status não permitida: ${order.status} → ${to}`);
  }
  const finished = to === 'COMPLETED' || to === 'DELIVERED' || to === 'CANCELED';
  const closedAt = finished ? (order.closedAt ?? new Date()) : null;
  await prisma.serviceOrder.update({ where: { id }, data: { status: to, closedAt } });
  return getById(id);
}

export async function addItem(id: string, input: z.infer<typeof itemSchema>) {
  const order = await getRaw(id);
  if (isClosed(order.status)) throw new AppError(409, 'OS encerrada não aceita novos serviços');
  return prisma.serviceItem.create({ data: { ...input, orderId: id } });
}

export async function removeItem(id: string, itemId: string) {
  const order = await getRaw(id);
  if (isClosed(order.status)) throw new AppError(409, 'OS encerrada não permite remover serviços');
  const item = order.items.find((i) => i.id === itemId);
  if (!item) throw notFound('Serviço');
  await prisma.serviceItem.delete({ where: { id: itemId } });
}
