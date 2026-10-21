import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

// Mensagens para campos únicos (P2002); o campo vai em details para o front mostrar no input
const duplicateMessages: Record<string, string> = {
  plate: 'Já existe um veículo com esta placa',
  email: 'Já existe um usuário com este e-mail',
};

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof AppError) {
    const details = err.field ? { details: [{ field: err.field, message: err.message }] } : {};
    return res.status(err.status).json({ error: err.message, ...details });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = ([] as string[]).concat((err.meta?.target as string[] | string) ?? []).find((f) => f in duplicateMessages);
      if (field) return res.status(409).json({ error: duplicateMessages[field], details: [{ field, message: duplicateMessages[field] }] });
      return res.status(409).json({ error: 'Registro já existe (valor duplicado)' });
    }
    if (err.code === 'P2025') return res.status(404).json({ error: 'Registro não encontrado' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Erro interno do servidor' });
}
