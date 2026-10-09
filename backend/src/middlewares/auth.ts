import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Token não informado');
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as jwt.JwtPayload & { role: Role };
    req.user = { id: String(payload.sub), role: payload.role };
    next();
  } catch {
    throw new AppError(401, 'Token inválido ou expirado');
  }
}

/** Controle de acesso por perfil (RNF03). Ex.: requireRole('ADMIN') */
export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) throw new AppError(403, 'Acesso negado para este perfil');
    next();
  };
