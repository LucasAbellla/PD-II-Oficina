import { Router } from 'express';
import { asyncHandler, idParam, paginationSchema } from '../../lib/http.js';
import { validateBody } from '../../middlewares/validate.js';
import { customerSchema } from './customers.schema.js';
import * as service from './customers.service.js';

export const customersRouter = Router();

customersRouter.get(
  '/',
  asyncHandler(async (req, res) => res.json(await service.list(paginationSchema.parse(req.query)))),
);
customersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => res.json(await service.getById(idParam.parse(req.params).id))),
);
customersRouter.post(
  '/',
  validateBody(customerSchema),
  asyncHandler(async (req, res) => res.status(201).json(await service.create(req.body))),
);
customersRouter.put(
  '/:id',
  validateBody(customerSchema),
  asyncHandler(async (req, res) => res.json(await service.update(idParam.parse(req.params).id, req.body))),
);

// Área do cliente: código de acesso (PIN) entregue ao cliente pela oficina
customersRouter.post(
  '/:id/access-pin',
  asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.status(201).json(await service.generateAccessPin(idParam.parse(req.params).id));
  }),
);
customersRouter.delete(
  '/:id/access-pin',
  asyncHandler(async (req, res) => {
    await service.revokeAccess(idParam.parse(req.params).id);
    res.status(204).end();
  }),
);
