import { isValidCpf } from '../../lib/cpf.js';

export type Identifier = { kind: 'plate'; value: string } | { kind: 'document'; value: string };

const PLATE = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;

/** Interpreta o que o cliente digitou: placa (antiga ou Mercosul), CPF válido ou CNPJ (14 dígitos). */
export function parseIdentifier(input: string): Identifier | null {
  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (PLATE.test(clean)) return { kind: 'plate', value: clean };
  if (/^\d{11}$/.test(clean)) return isValidCpf(clean) ? { kind: 'document', value: clean } : null;
  if (/^\d{14}$/.test(clean)) return { kind: 'document', value: clean };
  return null;
}
