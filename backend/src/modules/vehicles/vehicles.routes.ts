import { Router } from 'express';
import { asyncHandler, idParam } from '../../lib/http.js';
import { validateBody } from '../../middlewares/validate.js';
import { vehicleListQuery, vehicleSchema } from './vehicles.schema.js';
import * as service from './vehicles.service.js';

export const vehiclesRouter = Router();

vehiclesRouter.get(
  '/',
  asyncHandler(async (req, res) => res.json(await service.list(vehicleListQuery.parse(req.query)))),
);
vehiclesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => res.json(await service.getById(idParam.parse(req.params).id))),
);
vehiclesRouter.get(
  '/:id/history',
  asyncHandler(async (req, res) => res.json(await service.history(idParam.parse(req.params).id))),
);
vehiclesRouter.post(
  '/',
  validateBody(vehicleSchema),
  asyncHandler(async (req, res) => res.status(201).json(await service.create(req.body))),
);
vehiclesRouter.put(
  '/:id',
  validateBody(vehicleSchema),
  asyncHandler(async (req, res) => res.json(await service.update(idParam.parse(req.params).id, req.body))),
);
