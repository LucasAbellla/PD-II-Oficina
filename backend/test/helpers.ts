import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import type { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

export { prisma };

export async function iniciarServidor() {
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}/api`,
    fechar: () => new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

export async function limparBanco() {
  await prisma.$transaction([
    prisma.serviceItem.deleteMany(),
    prisma.serviceOrder.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function criarUsuario(email: string, role: Role = 'ATTENDANT', senha = 'senha12345') {
  return prisma.user.create({
    data: { name: email.split('@')[0], email, role, passwordHash: await bcrypt.hash(senha, 4) },
  });
}

export interface Resposta<T = any> {
  status: number;
  body: T;
}

/** Cliente HTTP simples; envia o token quando informado. */
export function cliente(baseUrl: string, token?: string) {
  return async <T = any>(method: string, path: string, body?: unknown): Promise<Resposta<T>> => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : undefined };
  };
}

export async function login(baseUrl: string, email: string, password = 'senha12345') {
  const res = await cliente(baseUrl)<{ token: string }>('POST', '/auth/login', { email, password });
  if (res.status !== 200) throw new Error(`Falha no login de ${email}: ${res.status}`);
  return cliente(baseUrl, res.body.token);
}
