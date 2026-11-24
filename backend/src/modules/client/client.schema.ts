import { z } from 'zod';

export const clientLoginSchema = z.object({
  identifier: z.string().trim().min(5, 'Informe a placa ou o CPF').max(30),
  pin: z.string().regex(/^\d{6}$/, 'O código de acesso tem 6 dígitos'),
});
