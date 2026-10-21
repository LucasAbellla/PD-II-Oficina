import { z } from 'zod';

// Campo vazio vira null (e não undefined) para que a edição consiga limpar o valor no banco
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .optional();

export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Nome obrigatório'),
  document: optionalText,
  phone: optionalText,
  email: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .pipe(z.string().email('E-mail inválido').nullable())
    .optional(),
  notes: optionalText,
});

export type CustomerInput = z.infer<typeof customerSchema>;
