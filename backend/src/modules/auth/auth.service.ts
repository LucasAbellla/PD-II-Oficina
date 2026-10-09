import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { z } from 'zod';
import { env } from '../../config/env.js';
import { AppError, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import type { createUserSchema, loginSchema } from './auth.schema.js';

const publicUser = { id: true, name: true, email: true, role: true, createdAt: true } as const;

export async function login(input: z.infer<typeof loginSchema>) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Mensagem genérica de propósito: não revela se o e-mail existe.
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, 'E-mail ou senha inválidos');
  }
  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUser });
  if (!user) throw notFound('Usuário');
  return user;
}

export async function createUser(input: z.infer<typeof createUserSchema>) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.user.create({
    data: { name: input.name, email: input.email, role: input.role, passwordHash },
    select: publicUser,
  });
}
