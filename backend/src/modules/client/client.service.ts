import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { z } from 'zod';
import { clientJwtSecret } from '../../config/env.js';
import { AppError, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { buildTimeline } from '../service-orders/timeline.js';
import { parseIdentifier } from './identifier.js';
import type { clientLoginSchema } from './client.schema.js';

export interface ClientContext {
  customerId: string;
  vehicleId?: string;
}

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const SESSION = '2h';
const READY = ['COMPLETED', 'DELIVERED'];
// Hash descartável: gasta o mesmo tempo de CPU quando o identificador não existe (evita enumerar cadastros).
const DUMMY_HASH = bcrypt.hashSync('pin-descartavel', 10);
const denied = () => new AppError(401, 'Dados inválidos ou acesso temporariamente bloqueado');

export async function login(input: z.infer<typeof clientLoginSchema>) {
  const id = parseIdentifier(input.identifier);
  if (!id) throw new AppError(400, 'Informe a placa do veículo (ex.: ABC1D23) ou o CPF.');

  let customerIds: string[] = [];
  let vehicleId: string | undefined;
  if (id.kind === 'plate') {
    const v = await prisma.vehicle.findUnique({ where: { plate: id.value }, select: { id: true, customerId: true } });
    if (v) {
      customerIds = [v.customerId];
      vehicleId = v.id; // login por placa => acesso restrito a este veículo
    }
  } else {
    const customers = await prisma.customer.findMany({ where: { documentDigits: id.value }, select: { id: true } });
    customerIds = customers.map((c) => c.id); // login por documento => todos os veículos do cliente
  }

  const accesses = customerIds.length
    ? await prisma.customerAccess.findMany({ where: { customerId: { in: customerIds } } })
    : [];
  if (accesses.length === 0) {
    await bcrypt.compare(input.pin, DUMMY_HASH);
    throw denied();
  }

  const now = new Date();
  for (const a of accesses) {
    if (a.lockedUntil && a.lockedUntil > now) continue;
    if (await bcrypt.compare(input.pin, a.pinHash)) {
      await prisma.customerAccess.update({ where: { customerId: a.customerId }, data: { failedAttempts: 0, lockedUntil: null } });
      const token = jwt.sign({ typ: 'client', cid: a.customerId, ...(vehicleId ? { vid: vehicleId } : {}) }, clientJwtSecret, {
        expiresIn: SESSION,
      });
      return { token, scope: vehicleId ? ('vehicle' as const) : ('customer' as const) };
    }
    const attempts = a.failedAttempts + 1;
    await prisma.customerAccess.update({
      where: { customerId: a.customerId },
      data: attempts >= MAX_ATTEMPTS ? { failedAttempts: 0, lockedUntil: new Date(now.getTime() + LOCK_MS) } : { failedAttempts: attempts },
    });
  }
  throw denied();
}

export async function listVehicles(c: ClientContext) {
  const customer = await prisma.customer.findUnique({ where: { id: c.customerId }, select: { name: true } });
  const vehicles = await prisma.vehicle.findMany({
    where: { customerId: c.customerId, ...(c.vehicleId ? { id: c.vehicleId } : {}) },
    orderBy: { plate: 'asc' },
    include: { orders: { orderBy: { openedAt: 'desc' }, take: 1, select: { number: true, status: true, openedAt: true } } },
  });
  return {
    customerName: customer?.name ?? '',
    scope: c.vehicleId ? 'vehicle' : 'customer',
    vehicles: vehicles.map((v) => ({
      id: v.id,
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      year: v.year,
      color: v.color,
      latestOrder: v.orders[0] ?? null,
    })),
  };
}

/** Detalhe do veículo. Não expõe nomes de funcionários, observações internas, CPF nem telefone. */
export async function getVehicle(c: ClientContext, vehicleId: string) {
  if (c.vehicleId && c.vehicleId !== vehicleId) throw notFound('Veículo');
  const v = await prisma.vehicle.findFirst({
    where: { id: vehicleId, customerId: c.customerId },
    include: {
      orders: {
        orderBy: { openedAt: 'desc' },
        include: {
          items: { orderBy: { performedAt: 'asc' }, select: { id: true, description: true, performedAt: true } },
          events: { orderBy: { createdAt: 'asc' } },
          invoice: { select: { fileName: true, sizeBytes: true, uploadedAt: true } },
        },
      },
    },
  });
  if (!v) throw notFound('Veículo');

  return {
    vehicle: { id: v.id, plate: v.plate, brand: v.brand, model: v.model, year: v.year, color: v.color },
    orders: v.orders.map((o) => {
      const ready = READY.includes(o.status);
      const timeline = buildTimeline(
        o.events.map((e) => ({ id: e.id, fromStatus: e.fromStatus, toStatus: e.toStatus, createdAt: e.createdAt, by: null })),
        o.openedAt,
        null,
        { status: o.status, closedAt: o.closedAt },
      );
      return {
        id: o.id,
        number: o.number,
        status: o.status,
        description: o.description,
        openedAt: o.openedAt,
        closedAt: o.closedAt,
        items: o.items,
        timeline: timeline.map((t) => ({ status: t.toStatus, at: t.createdAt })),
        invoiceReady: ready,
        invoice: ready && o.invoice ? o.invoice : null, // só aparece com a OS pronta
      };
    }),
  };
}

export async function getInvoice(c: ClientContext, orderId: string) {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: { vehicle: { select: { id: true, customerId: true } }, invoice: true },
  });
  if (
    !order ||
    !order.invoice ||
    order.vehicle.customerId !== c.customerId ||
    (c.vehicleId && c.vehicleId !== order.vehicle.id) ||
    !READY.includes(order.status)
  ) {
    throw notFound('Nota fiscal'); // mesmo 404 para qualquer motivo
  }
  return { number: order.number, content: Buffer.from(order.invoice.content) };
}
