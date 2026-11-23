import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors.js';

/** Limitador simples em memória (por IP). Suficiente para o MVP; em escala, trocar por Redis. */
export function rateLimit(opts: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, _res: Response, next: NextFunction) => {
    const now = Date.now();
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
    const key = req.ip ?? 'unknown';
    const entry = hits.get(key);
    if (!entry || entry.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > opts.max) throw new AppError(429, 'Muitas requisições. Tente novamente em instantes.');
    next();
  };
}
