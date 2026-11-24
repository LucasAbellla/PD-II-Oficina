import type { OrderStatus } from './status.js';

export interface TimelineEvent {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  createdAt: Date;
  by: string | null;
}

/**
 * Monta a linha do tempo da OS. OS antigas (criadas antes do registro de eventos) não possuem eventos:
 * nesse caso, sintetiza-se a abertura (openedAt) e, se a OS já avançou, o status atual (na data de encerramento, se houver).
 */
export function buildTimeline(
  events: TimelineEvent[],
  openedAt: Date,
  openedBy: string | null,
  current?: { status: OrderStatus; closedAt: Date | null },
): TimelineEvent[] {
  if (events.length > 0) return [...events].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const fallback: TimelineEvent[] = [{ id: 'opening', fromStatus: null, toStatus: 'OPEN', createdAt: openedAt, by: openedBy }];
  if (current && current.status !== 'OPEN') {
    fallback.push({ id: 'current', fromStatus: 'OPEN', toStatus: current.status, createdAt: current.closedAt ?? openedAt, by: null });
  }
  return fallback;
}
