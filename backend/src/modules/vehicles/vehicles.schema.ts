import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const vehicleSchema = z.object({
  plate: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, 'Placa inválida (formato antigo ABC1234 ou Mercosul ABC1D23)'),
  brand: z.string().trim().min(1, 'Marca obrigatória'),
  model: z.string().trim().min(1, 'Modelo obrigatório'),
  // null limpa o campo na edição
  year: z.coerce.number().int().min(1900).max(currentYear + 1).nullable().optional(),
  color: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .optional(),
  customerId: z.string().uuid('Cliente inválido'),
});

export const vehicleListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  customerId: z.string().uuid().optional(),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
