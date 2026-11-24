import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET deve ter ao menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Portal do cliente
  PORTAL_TOKEN_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  WORKSHOP_NAME: z.string().default('Oficina'),
});

export const env = schema.parse(process.env);

/** Segredo distinto para tokens de cliente: um token de cliente nunca é aceito nas rotas de funcionário (e vice-versa). */
export const clientJwtSecret = env.JWT_SECRET + '.client';
