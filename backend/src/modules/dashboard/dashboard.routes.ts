import { Router } from 'express';
import { asyncHandler } from '../../lib/http.js';
import * as service from './dashboard.service.js';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/',
  asyncHandler(async (_req, res) => res.json(await service.summary())),
);
