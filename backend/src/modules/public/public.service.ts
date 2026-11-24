import { env } from '../../config/env.js';
import { notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { buildTimeline } from '../service-orders/timeline.js';
import { maskPlate } from './mask.js';

const TOKEN_FORMAT = /^[A-Za-z0-9_-]{20,64}$/;

/**
 * Dados exibidos ao cliente no link de acompanhamento.
 * Mínimo necessário: NÃO expõe CPF/CNPJ, telefone, e-mail, observações internas nem nomes de funcionários.
 * Token inválido, revogado ou expirado retornam o mesmo 404 (não revela se o link já existiu).
 */
export async function getPublicOrder(token: string) {
  if (!TOKEN_FORMAT.test(token)) throw notFound('Acompanhamento');

  const order = await prisma.serviceOrder.findUnique({
    where: { publicToken: token },
    include: {
      vehicle: true,
      items: { orderBy: { performedAt: 'asc' }, select: { id: true, description: true, performedAt: true } },
      events: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!order || !order.publicTokenExpiresAt || order.publicTokenExpiresAt < new Date()) {
    throw notFound('Acompanhamento');
  }

  const previous = await prisma.serviceOrder.findMany({
    where: { vehicleId: order.vehicleId, id: { not: order.id }, status: { in: ['COMPLETED', 'DELIVERED'] } },
    orderBy: { openedAt: 'desc' },
    take: 10,
    include: { items: { orderBy: { performedAt: 'asc' }, select: { description: true } } },
  });

  const timeline = buildTimeline(
    order.events.map((e) => ({ id: e.id, fromStatus: e.fromStatus, toStatus: e.toStatus, createdAt: e.createdAt, by: null })),
    order.openedAt,
    null,
    { status: order.status, closedAt: order.closedAt },
  );

  return {
    workshop: env.WORKSHOP_NAME,
    order: {
      number: order.number,
      status: order.status,
      description: order.description,
      openedAt: order.openedAt,
      closedAt: order.closedAt,
    },
    vehicle: {
      brand: order.vehicle.brand,
      model: order.vehicle.model,
      year: order.vehicle.year,
      color: order.vehicle.color,
      plate: maskPlate(order.vehicle.plate),
    },
    items: order.items,
    timeline: timeline.map((t) => ({ status: t.toStatus, at: t.createdAt })),
    history: previous.map((o) => ({
      number: o.number,
      openedAt: o.openedAt,
      status: o.status,
      services: o.items.map((i) => i.description),
    })),
    expiresAt: order.publicTokenExpiresAt,
    generatedAt: new Date(),
  };
}
