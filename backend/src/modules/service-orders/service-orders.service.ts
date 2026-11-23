import { randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { env } from '../../config/env.js';
import { AppError, notFound } from '../../lib/errors.js';
import { pageMeta } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import type { createOrderSchema, itemSchema, orderListQuery } from './service-orders.schema.js';
import { allowedTransitions, canTransition, isClosed, type OrderStatus } from './status.js';
import { buildTimeline, type TimelineEvent } from './timeline.js';

const fullInclude = {
  vehicle: { include: { customer: { select: { id: true, name: true, phone: true } } } },
  items: { orderBy: { performedAt: 'asc' } },
  createdBy: { select: { id: true, name: true } },
  events: { orderBy: { createdAt: 'asc' }, include: { createdBy: { select: { name: true } } } },
  invoice: { select: { id: true, fileName: true, sizeBytes: true, uploadedAt: true } },
} satisfies Prisma.ServiceOrderInclude;

export async function list(opts: z.infer<typeof orderListQuery>) {
  const where: Prisma.ServiceOrderWhereInput = {
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.vehicleId ? { vehicleId: opts.vehicleId } : {}),
    ...(opts.search
      ? {
          OR: [
            { description: { contains: opts.search, mode: 'insensitive' } },
            { vehicle: { plate: { contains: opts.search.toUpperCase() } } },
            { vehicle: { customer: { name: { contains: opts.search, mode: 'insensitive' } } } },
            ...(/^\d+$/.test(opts.search) ? [{ number: Number(opts.search) }] : []),
          ],
        }
      : {}),
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

/** Quantidade de OS por status (usado nos filtros da tela de OS). */
export async function summary() {
  const groups = await prisma.serviceOrder.groupBy({ by: ['status'], _count: { _all: true } });
  const counts: Record<OrderStatus, number> = { OPEN: 0, IN_PROGRESS: 0, COMPLETED: 0, DELIVERED: 0, CANCELED: 0 };
  for (const g of groups) counts[g.status] = g._count._all;
  return counts;
}

async function getRaw(id: string) {
  const order = await prisma.serviceOrder.findUnique({ where: { id }, include: fullInclude });
  if (!order) throw notFound('Ordem de serviço');
  return order;
}

export async function getById(id: string) {
  const order = await getRaw(id);
  const events: TimelineEvent[] = buildTimeline(
    order.events.map((e) => ({
      id: e.id,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      createdAt: e.createdAt,
      by: e.createdBy?.name ?? null,
    })),
    order.openedAt,
    order.createdBy.name,
    { status: order.status, closedAt: order.closedAt },
  );
  return { ...order, events, allowedTransitions: allowedTransitions(order.status) };
}

export async function create(input: z.infer<typeof createOrderSchema>, userId: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId }, select: { id: true } });
  if (!vehicle) throw new AppError(400, 'Veículo informado não existe');
  return prisma.$transaction(async (tx) => {
    const order = await tx.serviceOrder.create({ data: { ...input, createdById: userId } });
    await tx.statusEvent.create({ data: { orderId: order.id, toStatus: 'OPEN', createdById: userId } });
    return order;
  });
}

export async function changeStatus(id: string, to: OrderStatus, userId: string) {
  const order = await getRaw(id);
  if (!canTransition(order.status, to)) {
    throw new AppError(409, `Transição de status não permitida: ${order.status} → ${to}`);
  }
  const finished = to === 'COMPLETED' || to === 'DELIVERED' || to === 'CANCELED';
  const closedAt = finished ? (order.closedAt ?? new Date()) : null;
  await prisma.$transaction([
    prisma.serviceOrder.update({ where: { id }, data: { status: to, closedAt } }),
    prisma.statusEvent.create({ data: { orderId: id, fromStatus: order.status, toStatus: to, createdById: userId } }),
  ]);
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

/** Gera (ou renova) o link público de acompanhamento. Um novo link invalida o anterior. */
export async function createShareLink(id: string) {
  await getRaw(id);
  const token = randomBytes(24).toString('base64url'); // 192 bits de entropia, não adivinhável
  const expiresAt = new Date(Date.now() + env.PORTAL_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await prisma.serviceOrder.update({ where: { id }, data: { publicToken: token, publicTokenExpiresAt: expiresAt } });
  return { token, expiresAt };
}

export async function revokeShareLink(id: string) {
  await getRaw(id);
  await prisma.serviceOrder.update({ where: { id }, data: { publicToken: null, publicTokenExpiresAt: null } });
}

const MAX_PDF_BYTES = 5 * 1024 * 1024;

/** Anexa (ou substitui) a nota fiscal em PDF. Só quando a OS está pronta (Concluída ou Entregue). */
export async function uploadInvoice(id: string, userId: string, fileName: string, content: Buffer) {
  const order = await getRaw(id);
  if (order.status !== 'COMPLETED' && order.status !== 'DELIVERED') {
    throw new AppError(409, 'A nota fiscal só pode ser anexada quando a OS estiver Concluída ou Entregue');
  }
  if (content.length === 0 || content.length > MAX_PDF_BYTES) throw new AppError(400, 'Arquivo vazio ou maior que 5 MB');
  if (content.subarray(0, 5).toString('latin1') !== '%PDF-') throw new AppError(400, 'O arquivo precisa ser um PDF válido');
  const safeName = fileName.replace(/[^\w.\- ]+/g, '_').slice(0, 120) || 'nota-fiscal.pdf';
  return prisma.orderInvoice.upsert({
    where: { orderId: id },
    create: { orderId: id, fileName: safeName, sizeBytes: content.length, content, uploadedById: userId },
    update: { fileName: safeName, sizeBytes: content.length, content, uploadedAt: new Date(), uploadedById: userId },
    select: { id: true, fileName: true, sizeBytes: true, uploadedAt: true },
  });
}

export async function getInvoice(id: string) {
  const inv = await prisma.orderInvoice.findUnique({ where: { orderId: id }, include: { order: { select: { number: true } } } });
  if (!inv) throw notFound('Nota fiscal');
  return { number: inv.order.number, content: Buffer.from(inv.content) };
}

export async function deleteInvoice(id: string) {
  await getRaw(id);
  await prisma.orderInvoice.deleteMany({ where: { orderId: id } });
}
