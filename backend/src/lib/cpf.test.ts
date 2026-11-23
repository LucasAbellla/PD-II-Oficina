import { describe, expect, it } from 'vitest';
import { isValidCpf, onlyDigits } from './cpf.js';

describe('cpf', () => {
  it('valida CPFs corretos e rejeita inválidos', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('529.982.247-26')).toBe(false);
    expect(isValidCpf('111.111.111-11')).toBe(false);
    expect(isValidCpf('123')).toBe(false);
  });
  it('extrai apenas dígitos', () => {
    expect(onlyDigits('529.982.247-25')).toBe('52998224725');
  });
});
