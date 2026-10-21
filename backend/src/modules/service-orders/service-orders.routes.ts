import { Router } from 'express';
import { asyncHandler, idParam } from '../../lib/http.js';
import { validateBody } from '../../middlewares/validate.js';
import {
  createOrderSchema,
  itemSchema,
  orderItemParams,
  orderListQuery,
  statusSchema,
} from './service-orders.schema.js';
import * as service from './service-orders.service.js';

export const serviceOrdersRouter = Router();

serviceOrdersRouter.get(
  '/',
  asyncHandler(async (req, res) => res.json(await service.list(orderListQuery.parse(req.query)))),
);
serviceOrdersRouter.get(
  '/summary',
  asyncHandler(async (_req, res) => res.json(await service.summary())),
);
serviceOrdersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => res.json(await service.getById(idParam.parse(req.params).id))),
);
serviceOrdersRouter.post(
  '/',
  validateBody(createOrderSchema),
  asyncHandler(async (req, res) => res.status(201).json(await service.create(req.body, req.user!.id))),
);
serviceOrdersRouter.patch(
  '/:id/status',
  validateBody(statusSchema),
  asyncHandler(async (req, res) =>
    res.json(await service.changeStatus(idParam.parse(req.params).id, req.body.status)),
  ),
);
serviceOrdersRouter.post(
  '/:id/items',
  validateBody(itemSchema),
  asyncHandler(async (req, res) => res.status(201).json(await service.addItem(idParam.parse(req.params).id, req.body))),
);
serviceOrdersRouter.delete(
  '/:id/items/:itemId',
  asyncHandler(async (req, res) => {
    const { id, itemId } = orderItemParams.parse(req.params);
    await service.removeItem(id, itemId);
    res.status(204).end();
  }),
);
