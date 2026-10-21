import { z } from 'zod';

const password = z.string().min(8, 'A senha deve ter ao menos 8 caracteres');

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Nome obrigatório'),
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password,
  role: z.enum(['ADMIN', 'ATTENDANT']).default('ATTENDANT'),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, 'Nome obrigatório'),
  role: z.enum(['ADMIN', 'ATTENDANT']),
  active: z.boolean(),
});

/** Senha definida pelo ADMIN para outro usuário (ex.: funcionário esqueceu a senha). */
export const resetPasswordSchema = z.object({ password });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: password,
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    path: ['newPassword'],
    message: 'A nova senha deve ser diferente da atual',
  });
