import { describe, expect, it } from 'vitest';
import { formatKm, maskPhone, normalizePlate } from './format';

describe('maskPhone', () => {
  it('formata celular e fixo enquanto digita', () => {
    expect(maskPhone('')).toBe('');
    expect(maskPhone('5')).toBe('(5');
    expect(maskPhone('51999')).toBe('(51) 999');
    expect(maskPhone('5133334444')).toBe('(51) 3333-4444');
    expect(maskPhone('51999998888')).toBe('(51) 99999-8888');
  });

  it('ignora letras e corta excesso de dígitos', () => {
    expect(maskPhone('(51) 9a9999-88889999')).toBe('(51) 99999-8888');
  });
});

describe('normalizePlate', () => {
  it('deixa a placa em maiúsculas, sem separadores, com 7 caracteres', () => {
    expect(normalizePlate('abc-1234')).toBe('ABC1234');
    expect(normalizePlate('abc 1d23 extra')).toBe('ABC1D23');
  });
});

describe('formatKm', () => {
  it('mostra traço quando não há quilometragem', () => {
    expect(formatKm(null)).toBe('—');
    expect(formatKm(undefined)).toBe('—');
  });

  it('usa separador de milhar brasileiro', () => {
    expect(formatKm(0)).toBe('0 km');
    expect(formatKm(120000)).toBe('120.000 km');
  });
});
