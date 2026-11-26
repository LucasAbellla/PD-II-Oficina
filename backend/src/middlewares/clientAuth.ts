import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { clientJwtSecret } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import { issuedBefore } from '../lib/session.js';
import { prisma } from '../lib/prisma.js';

/** Sessão da área do cliente. O escopo vem do token: por placa (um veículo) ou por documento (todos os veículos). */
export function authenticateClient(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Sessão não iniciada');
  let payload: jwt.JwtPayload & { typ?: string; cid?: string; vid?: string };
  try {
    payload = jwt.verify(header.slice(7), clientJwtSecret) as typeof payload;
    if (payload.typ !== 'client' || !payload.cid) throw new Error('token inválido');
  } catch {
    throw new AppError(401, 'Sessão expirada. Entre novamente.');
  }
  // Código revogado ou trocado encerra as sessões abertas
  prisma.customerAccess
    .findUnique({ where: { customerId: payload.cid }, select: { pinIssuedAt: true } })
    .then((access) => {
      if (!access || issuedBefore(payload.iat, access.pinIssuedAt)) {
        return next(new AppError(401, 'Sessão expirada. Entre novamente.'));
      }
      req.client = { customerId: payload.cid!, vehicleId: payload.vid };
      next();
    })
    .catch(next);
}
