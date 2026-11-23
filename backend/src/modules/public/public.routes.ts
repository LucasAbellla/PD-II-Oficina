import { Router } from 'express';
import { asyncHandler } from '../../lib/http.js';
import { rateLimit } from '../../middlewares/rateLimit.js';
import * as service from './public.service.js';

export const publicRouter = Router();

// Rotas SEM autenticação: acesso somente por token não adivinhável. Limite de 60 req/min por IP.
publicRouter.use(rateLimit({ windowMs: 60_000, max: 60 }));

publicRouter.get(
  '/orders/:token',
  asyncHandler(async (req, res) => {
    const data = await service.getPublicOrder(String(req.params.token));
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');
    res.json(data);
  }),
);
