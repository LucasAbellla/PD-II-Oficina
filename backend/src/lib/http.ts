import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';

/** Encaminha erros de handlers assíncronos para o errorHandler (Express 4). */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export const idParam = z.object({ id: z.string().uuid() });

export function pageMeta(page: number, pageSize: number, total: number) {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function sendPdf(res: Response, osNumber: number, content: Buffer) {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="nota-fiscal-OS${osNumber}.pdf"`,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.send(content);
}
