import { prisma } from '../../lib/prisma.js';
import type { OrderStatus } from '../service-orders/status.js';
import { stageAverages } from './metrics.js';

const STATUSES: OrderStatus[] = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELED'];

export async function summary() {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [grouped, last30Days, perVehicle, events, totalCustomers, totalVehicles] = await Promise.all([
    prisma.serviceOrder.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.serviceOrder.count({ where: { openedAt: { gte: since30 } } }),
    prisma.serviceOrder.groupBy({ by: ['vehicleId'], _count: { _all: true } }),
    prisma.statusEvent.findMany({
      where: { createdAt: { gte: since90 } },
      select: { orderId: true, toStatus: true, createdAt: true },
    }),
    prisma.customer.count(),
    prisma.vehicle.count(),
  ]);

  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  for (const g of grouped) byStatus[g.status] = g._count._all;

  return {
    byStatus,
    inProgressNow: byStatus.OPEN + byStatus.IN_PROGRESS + byStatus.COMPLETED,
    last30Days,
    returningVehicles: perVehicle.filter((v) => v._count._all >= 2).length,
    totalCustomers,
    totalVehicles,
    averageMinutes: stageAverages(events),
  };
}
