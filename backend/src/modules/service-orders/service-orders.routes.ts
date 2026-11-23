import express, { Router } from 'express';
import { AppError } from '../../lib/errors.js';
import { asyncHandler, idParam, sendPdf } from '../../lib/http.js';
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
    res.json(await service.changeStatus(idParam.parse(req.params).id, req.body.status, req.user!.id)),
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

// Link público de acompanhamento (cliente vê status, serviços e histórico sem login)
serviceOrdersRouter.post(
  '/:id/share',
  asyncHandler(async (req, res) => res.status(201).json(await service.createShareLink(idParam.parse(req.params).id))),
);
serviceOrdersRouter.delete(
  '/:id/share',
  asyncHandler(async (req, res) => {
    await service.revokeShareLink(idParam.parse(req.params).id);
    res.status(204).end();
  }),
);

// Nota fiscal (PDF): upload cru (sem multer), limite de 5 MB. Nome do arquivo vem no cabeçalho X-File-Name.
serviceOrdersRouter.put(
  '/:id/invoice',
  express.raw({ type: ['application/pdf', 'application/octet-stream'], limit: '5mb' }),
  asyncHandler(async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) throw new AppError(400, 'Envie um arquivo PDF');
    let name = 'nota-fiscal.pdf';
    try {
      name = decodeURIComponent(String(req.headers['x-file-name'] ?? name));
    } catch {
      /* mantém o nome padrão */
    }
    res.status(201).json(await service.uploadInvoice(idParam.parse(req.params).id, req.user!.id, name, req.body));
  }),
);
serviceOrdersRouter.get(
  '/:id/invoice',
  asyncHandler(async (req, res) => {
    const inv = await service.getInvoice(idParam.parse(req.params).id);
    sendPdf(res, inv.number, inv.content);
  }),
);
serviceOrdersRouter.delete(
  '/:id/invoice',
  asyncHandler(async (req, res) => {
    await service.deleteInvoice(idParam.parse(req.params).id);
    res.status(204).end();
  }),
);
