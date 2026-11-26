import { describe, expect, it } from 'vitest';
import { issuedBefore } from './session.js';

describe('issuedBefore', () => {
  const instante = new Date('2026-11-25T12:00:00.700Z');
  const segundos = Math.floor(instante.getTime() / 1000);

  it('invalida tokens emitidos em segundos anteriores', () => {
    expect(issuedBefore(segundos - 1, instante)).toBe(true);
    expect(issuedBefore(undefined, instante)).toBe(true);
  });

  it('aceita tokens do mesmo segundo ou posteriores e quando não há data', () => {
    expect(issuedBefore(segundos, instante)).toBe(false);
    expect(issuedBefore(segundos + 5, instante)).toBe(false);
    expect(issuedBefore(segundos - 1, null)).toBe(false);
  });
});
