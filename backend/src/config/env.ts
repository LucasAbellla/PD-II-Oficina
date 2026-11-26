import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET deve ter ao menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Proxies na frente da API (número de saltos, "true"/"false" ou lista de IPs). Em produção, padrão 1.
  TRUST_PROXY: z.string().optional(),
  // Portal do cliente
  PORTAL_TOKEN_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  WORKSHOP_NAME: z.string().default('Oficina'),
});

export const env = schema.parse(process.env);

/** Valor para app.set('trust proxy'): define de onde sai o req.ip usado no limite de tentativas. */
export function trustProxySetting(): number | boolean | string | undefined {
  const raw = env.TRUST_PROXY?.trim() ?? (env.NODE_ENV === 'production' ? '1' : undefined);
  if (raw === undefined || raw === '') return undefined;
  if (/^\d+$/.test(raw)) return Number(raw);
  if (raw === 'true' || raw === 'false') return raw === 'true';
  return raw;
}

/** Segredo distinto para tokens de cliente: um token de cliente nunca é aceito nas rotas de funcionário (e vice-versa). */
export const clientJwtSecret = env.JWT_SECRET + '.client';
