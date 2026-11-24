import { describe, expect, it } from 'vitest';
import { stageAverages } from './metrics.js';

const t = (min: number) => new Date(Date.UTC(2026, 9, 1, 8, 0) + min * 60_000);

describe('stageAverages', () => {
  it('calcula o tempo médio por etapa e o total até a conclusão', () => {
    const events = [
      { orderId: 'a', toStatus: 'OPEN' as const, createdAt: t(0) },
      { orderId: 'a', toStatus: 'IN_PROGRESS' as const, createdAt: t(30) },
      { orderId: 'a', toStatus: 'COMPLETED' as const, createdAt: t(150) },
      { orderId: 'b', toStatus: 'OPEN' as const, createdAt: t(0) },
      { orderId: 'b', toStatus: 'IN_PROGRESS' as const, createdAt: t(10) },
    ];
    const r = stageAverages(events);
    expect(r.OPEN).toBe(20); // (30 + 10) / 2
    expect(r.IN_PROGRESS).toBe(120); // só a OS "a" encerrou a etapa
    expect(r.TOTAL).toBe(150);
    expect(r.COMPLETED).toBeNull();
  });

  it('retorna nulo sem dados', () => {
    expect(stageAverages([]).TOTAL).toBeNull();
  });
});
