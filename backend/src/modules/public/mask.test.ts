import { describe, expect, it } from 'vitest';
import { maskPlate } from './mask.js';

describe('maskPlate', () => {
  it('mantém só as 3 letras iniciais', () => {
    expect(maskPlate('ABC1D23')).toBe('ABC****');
    expect(maskPlate('ABC1234')).toBe('ABC****');
  });
});
