import { z } from 'zod';

export const createOrderSchema = z.object({
  vehicleId: z.string().uuid('Veículo inválido'),
  description: z.string().trim().min(3, 'Descreva o problema relatado'),
  mileageIn: z.coerce.number().int().min(0).optional(),
});

export const statusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELED']),
});

export const itemSchema = z.object({
  description: z.string().trim().min(2, 'Descrição do serviço obrigatória'),
  notes: z.string().trim().optional(),
});

export const orderListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELED']).optional(),
  vehicleId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
});

export const orderItemParams = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });
