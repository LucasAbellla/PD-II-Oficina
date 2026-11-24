import type { OrderStatus } from '../service-orders/status.js';

export interface EventLite {
  orderId: string;
  toStatus: OrderStatus;
  createdAt: Date;
}

export type StageKey = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

export interface StageAverages {
  OPEN: number | null;
  IN_PROGRESS: number | null;
  COMPLETED: number | null;
  /** Tempo médio entre a abertura e a conclusão da OS. */
  TOTAL: number | null;
}

const avg = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/**
 * Tempo médio (em minutos) que as OS permaneceram em cada etapa, calculado a partir dos eventos de status.
 * Só conta etapas já encerradas (existe um evento seguinte).
 */
export function stageAverages(events: EventLite[]): StageAverages {
  const byOrder = new Map<string, EventLite[]>();
  for (const e of events) byOrder.set(e.orderId, [...(byOrder.get(e.orderId) ?? []), e]);

  const buckets: Record<StageKey, number[]> = { OPEN: [], IN_PROGRESS: [], COMPLETED: [] };
  const totals: number[] = [];

  for (const list of byOrder.values()) {
    const sorted = [...list].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (let i = 0; i < sorted.length - 1; i++) {
      const stage = sorted[i].toStatus;
      if (stage === 'OPEN' || stage === 'IN_PROGRESS' || stage === 'COMPLETED') {
        buckets[stage].push((sorted[i + 1].createdAt.getTime() - sorted[i].createdAt.getTime()) / 60_000);
      }
    }
    const completed = sorted.find((e) => e.toStatus === 'COMPLETED');
    if (completed) totals.push((completed.createdAt.getTime() - sorted[0].createdAt.getTime()) / 60_000);
  }

  return {
    OPEN: avg(buckets.OPEN),
    IN_PROGRESS: avg(buckets.IN_PROGRESS),
    COMPLETED: avg(buckets.COMPLETED),
    TOTAL: avg(totals),
  };
}
