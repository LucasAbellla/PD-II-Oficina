import { describe, expect, it } from 'vitest';
import { parseIdentifier } from './identifier.js';

describe('parseIdentifier', () => {
  it('reconhece placa antiga e Mercosul, com ou sem hífen/minúsculas', () => {
    expect(parseIdentifier('abc-1234')).toEqual({ kind: 'plate', value: 'ABC1234' });
    expect(parseIdentifier('ABC1D23')).toEqual({ kind: 'plate', value: 'ABC1D23' });
  });
  it('reconhece CPF válido e CNPJ (14 dígitos)', () => {
    expect(parseIdentifier('529.982.247-25')).toEqual({ kind: 'document', value: '52998224725' });
    expect(parseIdentifier('12.345.678/0001-90')).toEqual({ kind: 'document', value: '12345678000190' });
  });
  it('rejeita CPF inválido e texto qualquer', () => {
    expect(parseIdentifier('529.982.247-26')).toBeNull();
    expect(parseIdentifier('oi')).toBeNull();
  });
});
