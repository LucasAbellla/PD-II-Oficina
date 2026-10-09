import { Router } from 'express';
import { asyncHandler } from '../../lib/http.js';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validateBody } from '../../middlewares/validate.js';
import { createUserSchema, loginSchema } from './auth.schema.js';
import * as service from './auth.service.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => res.json(await service.login(req.body))),
);

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => res.json(await service.me(req.user!.id))),
);

// Somente ADMIN cria novos usuários (RNF03)
authRouter.post(
  '/users',
  authenticate,
  requireRole('ADMIN'),
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => res.status(201).json(await service.createUser(req.body))),
);
