import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .optional();

export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Nome obrigatório'),
  document: optionalText,
  phone: optionalText,
  email: z
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(z.string().email('E-mail inválido').optional())
    .optional(),
  notes: optionalText,
});

export type CustomerInput = z.infer<typeof customerSchema>;
