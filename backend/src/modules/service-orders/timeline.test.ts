import { describe, expect, it } from 'vitest';
import { buildTimeline } from './timeline.js';

describe('buildTimeline', () => {
  it('sintetiza a abertura quando a OS não tem eventos', () => {
    const opened = new Date('2026-10-01T10:00:00Z');
    const t = buildTimeline([], opened, 'Ana');
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ toStatus: 'OPEN', createdAt: opened, by: 'Ana' });
  });

  it('ordena os eventos por data', () => {
    const a = { id: '1', fromStatus: null, toStatus: 'OPEN' as const, createdAt: new Date('2026-10-01T10:00:00Z'), by: null };
    const b = { id: '2', fromStatus: 'OPEN' as const, toStatus: 'IN_PROGRESS' as const, createdAt: new Date('2026-10-01T11:00:00Z'), by: null };
    expect(buildTimeline([b, a], a.createdAt, null).map((e) => e.id)).toEqual(['1', '2']);
  });

  it('inclui o status atual em OS antigas que já avançaram', () => {
    const opened = new Date('2026-10-01T10:00:00Z');
    const closed = new Date('2026-10-02T10:00:00Z');
    const r = buildTimeline([], opened, null, { status: 'COMPLETED', closedAt: closed });
    expect(r.map((e) => e.toStatus)).toEqual(['OPEN', 'COMPLETED']);
    expect(r[1].createdAt).toEqual(closed);
  });
});
