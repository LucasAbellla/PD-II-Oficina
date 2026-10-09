import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

/** Valida (e normaliza) o corpo da requisição com Zod (RNF04). */
export const validateBody =
  (schema: ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
