import type { Server } from 'node:http';
import { once } from 'node:events';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  process.env.DATABASE_URL = 'postgresql://oficina:oficina@127.0.0.1:5432/oficina?schema=public';
  process.env.JWT_SECRET = 'segredo-de-teste-com-mais-de-16-caracteres';
  process.env.CORS_ORIGIN = 'http://localhost:5173';

  const { createApp } = await import('./app.js');
  server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Servidor de teste não iniciou');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

describe('API HTTP', () => {
  it('expõe o health check sem depender do banco', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });

  it('protege as rotas de negócio sem token', async () => {
    const response = await fetch(`${baseUrl}/api/customers`);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Token não informado' });
  });

  it('rejeita login malformado antes de acessar o banco', async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalido', password: '' }),
    });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string; details: unknown[] };
    expect(body.error).toBe('Dados inválidos');
    expect(body.details.length).toBeGreaterThan(0);
  });

  it('retorna 404 padronizado para rota inexistente', async () => {
    const response = await fetch(`${baseUrl}/api/inexistente`);
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Rota não encontrada' });
  });
});
