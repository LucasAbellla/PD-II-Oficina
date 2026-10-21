import { Router } from 'express';
import { asyncHandler, idParam } from '../../lib/http.js';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { validateBody } from '../../middlewares/validate.js';
import {
  changePasswordSchema,
  createUserSchema,
  loginSchema,
  resetPasswordSchema,
  updateUserSchema,
} from './auth.schema.js';
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

// Qualquer usuário pode trocar a própria senha
authRouter.patch(
  '/me/password',
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    await service.changePassword(req.user!.id, req.body);
    res.status(204).end();
  }),
);

// Gestão de usuários: somente ADMIN (RNF03)
authRouter.use('/users', authenticate, requireRole('ADMIN'));

authRouter.get(
  '/users',
  asyncHandler(async (_req, res) => res.json(await service.listUsers())),
);
authRouter.post(
  '/users',
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => res.status(201).json(await service.createUser(req.body))),
);
authRouter.put(
  '/users/:id',
  validateBody(updateUserSchema),
  asyncHandler(async (req, res) =>
    res.json(await service.updateUser(idParam.parse(req.params).id, req.body, req.user!.id)),
  ),
);
authRouter.put(
  '/users/:id/password',
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    await service.resetPassword(idParam.parse(req.params).id, req.body.password);
    res.status(204).end();
  }),
);
