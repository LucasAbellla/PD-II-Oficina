import { describe, expect, it } from 'vitest';
import { allowedTransitions, canTransition, isClosed } from './status.js';

describe('status da OS', () => {
  it('permite o fluxo principal', () => {
    expect(canTransition('OPEN', 'IN_PROGRESS')).toBe(true);
    expect(canTransition('IN_PROGRESS', 'COMPLETED')).toBe(true);
    expect(canTransition('COMPLETED', 'DELIVERED')).toBe(true);
  });

  it('permite cancelamento apenas antes da conclusão e reabertura da OS concluída', () => {
    expect(allowedTransitions('OPEN')).toEqual(['IN_PROGRESS', 'CANCELED']);
    expect(allowedTransitions('IN_PROGRESS')).toEqual(['COMPLETED', 'CANCELED']);
    expect(allowedTransitions('COMPLETED')).toEqual(['DELIVERED', 'IN_PROGRESS']);
    expect(canTransition('COMPLETED', 'IN_PROGRESS')).toBe(true);
    expect(canTransition('COMPLETED', 'CANCELED')).toBe(false);
  });

  it('bloqueia saltos e saídas de estados finais', () => {
    expect(canTransition('OPEN', 'DELIVERED')).toBe(false);
    expect(allowedTransitions('DELIVERED')).toEqual([]);
    expect(allowedTransitions('CANCELED')).toEqual([]);
  });

  it('identifica OS encerradas', () => {
    expect(isClosed('DELIVERED')).toBe(true);
    expect(isClosed('CANCELED')).toBe(true);
    expect(isClosed('IN_PROGRESS')).toBe(false);
    expect(isClosed('COMPLETED')).toBe(false);
  });
});
