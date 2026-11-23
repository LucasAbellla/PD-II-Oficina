import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authenticate } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { clientRouter } from './modules/client/client.routes.js';
import { customersRouter } from './modules/customers/customers.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { publicRouter } from './modules/public/public.routes.js';
import { serviceOrdersRouter } from './modules/service-orders/service-orders.routes.js';
import { vehiclesRouter } from './modules/vehicles/vehicles.routes.js';

export function createApp() {
  const app = express();
  if (env.NODE_ENV === 'production') app.set('trust proxy', 1); // IP real atrás do proxy (Render)
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(',') }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRouter);

  // Sem login de funcionário: link público por OS (token) e área do cliente (placa/CPF + código de acesso)
  app.use('/api/public', publicRouter);
  app.use('/api/client', clientRouter);

  // Tudo abaixo exige autenticação. Para expandir: crie um novo módulo em
  // src/modules/<nome>/ e registre o router aqui.
  app.use('/api/customers', authenticate, customersRouter);
  app.use('/api/vehicles', authenticate, vehiclesRouter);
  app.use('/api/service-orders', authenticate, serviceOrdersRouter);
  app.use('/api/dashboard', authenticate, dashboardRouter);

  app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));
  app.use(errorHandler);
  return app;
}
