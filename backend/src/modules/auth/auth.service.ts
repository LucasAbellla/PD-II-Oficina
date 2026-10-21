import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { z } from 'zod';
import { env } from '../../config/env.js';
import { AppError, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import type { changePasswordSchema, createUserSchema, loginSchema, updateUserSchema } from './auth.schema.js';

const publicUser = { id: true, name: true, email: true, role: true, active: true, createdAt: true } as const;

export async function login(input: z.infer<typeof loginSchema>) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Mensagem genérica de propósito: não revela se o e-mail existe.
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, 'E-mail ou senha inválidos');
  }
  if (!user.active) throw new AppError(403, 'Usuário desativado. Procure o administrador da oficina.');
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

export const listUsers = () =>
  prisma.user.findMany({ select: publicUser, orderBy: [{ active: 'desc' }, { name: 'asc' }] });

export async function createUser(input: z.infer<typeof createUserSchema>) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.user.create({
    data: { name: input.name, email: input.email, role: input.role, passwordHash },
    select: publicUser,
  });
}

export async function updateUser(id: string, input: z.infer<typeof updateUserSchema>, actingUserId: string) {
  await me(id);
  // Evita que o ADMIN perca o próprio acesso (sempre sobra ao menos um ADMIN ativo)
  if (id === actingUserId && (!input.active || input.role !== 'ADMIN')) {
    throw new AppError(409, 'Você não pode desativar nem remover o perfil de administrador do próprio usuário');
  }
  return prisma.user.update({ where: { id }, data: input, select: publicUser });
}

export async function resetPassword(id: string, password: string) {
  await me(id);
  await prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
}

export async function changePassword(userId: string, input: z.infer<typeof changePasswordSchema>) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('Usuário');
  if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
    throw new AppError(400, 'Senha atual incorreta', 'currentPassword');
  }
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(input.newPassword, 10) } });
}
