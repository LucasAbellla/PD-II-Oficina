import { Router } from 'express';
import { asyncHandler, idParam, sendPdf } from '../../lib/http.js';
import { authenticateClient } from '../../middlewares/clientAuth.js';
import { rateLimit } from '../../middlewares/rateLimit.js';
import { validateBody } from '../../middlewares/validate.js';
import { clientLoginSchema } from './client.schema.js';
import * as service from './client.service.js';

export const clientRouter = Router();

// Tentativas de login: 10 a cada 15 min por IP (além do bloqueio por cliente após 5 erros de código).
clientRouter.post(
  '/login',
  rateLimit({ windowMs: 15 * 60_000, max: 10 }),
  validateBody(clientLoginSchema),
  asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(await service.login(req.body));
  }),
);

clientRouter.use(rateLimit({ windowMs: 60_000, max: 120 }), authenticateClient);

clientRouter.get(
  '/vehicles',
  asyncHandler(async (req, res) => res.json(await service.listVehicles(req.client!))),
);
clientRouter.get(
  '/vehicles/:id',
  asyncHandler(async (req, res) => res.json(await service.getVehicle(req.client!, idParam.parse(req.params).id))),
);
clientRouter.get(
  '/orders/:id/invoice',
  asyncHandler(async (req, res) => {
    const inv = await service.getInvoice(req.client!, idParam.parse(req.params).id);
    sendPdf(res, inv.number, inv.content);
  }),
);
