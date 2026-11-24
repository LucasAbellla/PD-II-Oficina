import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { clientJwtSecret } from '../config/env.js';
import { AppError } from '../lib/errors.js';

/** Sessão da área do cliente. O escopo vem do token: por placa (um veículo) ou por documento (todos os veículos). */
export function authenticateClient(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Sessão não iniciada');
  try {
    const p = jwt.verify(header.slice(7), clientJwtSecret) as jwt.JwtPayload & { typ?: string; cid?: string; vid?: string };
    if (p.typ !== 'client' || !p.cid) throw new Error('token inválido');
    req.client = { customerId: p.cid, vehicleId: p.vid };
    next();
  } catch {
    throw new AppError(401, 'Sessão expirada. Entre novamente.');
  }
}
