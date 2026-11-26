import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { issuedBefore } from '../lib/session.js';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Token não informado');
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(header.slice(7), env.JWT_SECRET) as jwt.JwtPayload;
  } catch {
    throw new AppError(401, 'Token inválido ou expirado');
  }
  // Consulta o usuário a cada requisição: desativação, troca de perfil e troca de senha valem na hora
  prisma.user
    .findUnique({ where: { id: String(payload.sub) }, select: { id: true, role: true, active: true, passwordChangedAt: true } })
    .then((user) => {
      if (!user || !user.active) return next(new AppError(401, 'Usuário desativado ou inexistente'));
      if (issuedBefore(payload.iat, user.passwordChangedAt)) return next(new AppError(401, 'Senha alterada. Entre novamente.'));
      req.user = { id: user.id, role: user.role };
      next();
    })
    .catch(next);
}

/** Controle de acesso por perfil (RNF03). Ex.: requireRole('ADMIN') */
export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) throw new AppError(403, 'Acesso negado para este perfil');
    next();
  };
