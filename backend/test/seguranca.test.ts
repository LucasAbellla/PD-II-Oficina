import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cliente, criarUsuario, iniciarServidor, limparBanco, login, prisma } from './helpers.js';

let servidor: Awaited<ReturnType<typeof iniciarServidor>>;
let admin: ReturnType<typeof cliente>;
let atendente: ReturnType<typeof cliente>;
let customerId: string;
let vehicleId: string;

// Cada chamada sai de um IP diferente (X-Forwarded-For), como um ataque distribuído
let ipSeq = 0;
const novoIp = () => `10.0.${Math.floor(ipSeq / 250)}.${(ipSeq++ % 250) + 1}`;
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function entrarCliente(identifier: string, pin: string) {
  const res = await fetch(`${servidor.baseUrl}/client/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': novoIp() },
    body: JSON.stringify({ identifier, pin }),
  });
  return { status: res.status, body: (await res.json()) as { token?: string } };
}

async function gerarCodigo() {
  const res = await atendente('POST', `/customers/${customerId}/access-pin`);
  expect(res.status).toBe(201);
  return res.body.pin as string;
}

async function tokenFuncionario(email: string, password = 'senha12345') {
  const res = await cliente(servidor.baseUrl)<{ token: string }>('POST', '/auth/login', { email, password });
  return res.body.token;
}

const codigoErrado = (pin: string) => (pin === '000000' ? '111111' : '000000');

beforeAll(async () => {
  await limparBanco();
  await criarUsuario('admin@teste.local', 'ADMIN');
  await criarUsuario('atendente@teste.local');
  servidor = await iniciarServidor();
  admin = await login(servidor.baseUrl, 'admin@teste.local');
  atendente = await login(servidor.baseUrl, 'atendente@teste.local');
  customerId = (await atendente('POST', '/customers', {
    name: 'Cliente Seguro',
    document: '529.982.247-25',
    phone: '(51) 98888-7777',
    email: 'seguro@exemplo.com',
  })).body.id;
  vehicleId = (await atendente('POST', '/vehicles', { plate: 'SEG1A23', brand: 'Fiat', model: 'Mobi', customerId })).body.id;
});

afterAll(async () => {
  await servidor?.fechar();
  await prisma.$disconnect();
});

describe('código de acesso do cliente', () => {
  it('bloqueia após 5 erros mesmo com tentativas simultâneas', async () => {
    const pin = await gerarCodigo();
    const tentativas = await Promise.all(Array.from({ length: 10 }, () => entrarCliente('SEG1A23', codigoErrado(pin))));
    expect(tentativas.every((t) => t.status === 401)).toBe(true);

    // Bloqueado: nem o código certo entra
    expect((await entrarCliente('SEG1A23', pin)).status).toBe(401);
    const acesso = await prisma.customerAccess.findUniqueOrThrow({ where: { customerId } });
    expect(acesso.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it('código certo zera o contador de erros', async () => {
    const pin = await gerarCodigo(); // novo código também desbloqueia
    for (let i = 0; i < 2; i++) expect((await entrarCliente('SEG1A23', codigoErrado(pin))).status).toBe(401);
    expect((await entrarCliente('529.982.247-25', pin)).status).toBe(200);
    const acesso = await prisma.customerAccess.findUniqueOrThrow({ where: { customerId } });
    expect(acesso).toMatchObject({ failedAttempts: 0, lockedUntil: null });
  });

  it('revogar o código encerra a sessão aberta', async () => {
    const pin = await gerarCodigo();
    const { body } = await entrarCliente('SEG1A23', pin);
    const sessao = cliente(servidor.baseUrl, body.token);
    expect((await sessao('GET', '/client/vehicles')).status).toBe(200);

    expect((await atendente('DELETE', `/customers/${customerId}/access-pin`)).status).toBe(204);
    expect((await sessao('GET', '/client/vehicles')).status).toBe(401);
  });

  it('gerar novo código encerra a sessão aberta com o anterior', async () => {
    const pin = await gerarCodigo();
    const sessao = cliente(servidor.baseUrl, (await entrarCliente('SEG1A23', pin)).body.token);
    expect((await sessao('GET', '/client/vehicles')).status).toBe(200);

    await esperar(1100); // o iat do token tem resolução de segundos
    const novo = await gerarCodigo();
    expect((await sessao('GET', '/client/vehicles')).status).toBe(401);
    expect((await entrarCliente('SEG1A23', novo)).status).toBe(200);
  });
});

describe('sessões de funcionário', () => {
  it('trocar a senha encerra as outras sessões e mantém a atual com token novo', async () => {
    await criarUsuario('troca@teste.local');
    const tokenA = await tokenFuncionario('troca@teste.local');
    const tokenB = await tokenFuncionario('troca@teste.local');
    await esperar(1100);

    const troca = await cliente(servidor.baseUrl, tokenA)('PATCH', '/auth/me/password', {
      currentPassword: 'senha12345',
      newPassword: 'novaSenha123',
    });
    expect(troca.status).toBe(200);
    expect((await cliente(servidor.baseUrl, tokenB)('GET', '/customers')).status).toBe(401);
    expect((await cliente(servidor.baseUrl, troca.body.token)('GET', '/customers')).status).toBe(200);
  });

  it('senha redefinida pelo ADMIN encerra a sessão do usuário', async () => {
    const user = await criarUsuario('reset@teste.local');
    const sessao = cliente(servidor.baseUrl, await tokenFuncionario('reset@teste.local'));
    await esperar(1100);

    expect((await admin('PUT', `/auth/users/${user.id}/password`, { password: 'outraSenha123' })).status).toBe(204);
    expect((await sessao('GET', '/customers')).status).toBe(401);
  });
});

describe('anonimização do cliente (LGPD)', () => {
  it('somente ADMIN pode anonimizar', async () => {
    expect((await atendente('POST', `/customers/${customerId}/anonymize`)).status).toBe(403);
  });

  it('apaga os dados pessoais, encerra acessos e mantém o histórico', async () => {
    const order = (await atendente('POST', '/service-orders', { vehicleId, description: 'Revisão' })).body;
    const link = (await atendente('POST', `/service-orders/${order.id}/share`)).body;
    const pin = await gerarCodigo();
    const sessao = cliente(servidor.baseUrl, (await entrarCliente('SEG1A23', pin)).body.token);
    const publico = cliente(servidor.baseUrl);
    expect((await publico('GET', `/public/orders/${link.token}`)).status).toBe(200);

    const res = await admin('POST', `/customers/${customerId}/anonymize`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'Cliente anonimizado',
      document: null,
      documentDigits: null,
      phone: null,
      email: null,
      notes: null,
      access: null,
    });
    expect(res.body.anonymizedAt).not.toBeNull();

    expect((await sessao('GET', '/client/vehicles')).status).toBe(401);
    expect((await publico('GET', `/public/orders/${link.token}`)).status).toBe(404);
    expect((await entrarCliente('529.982.247-25', pin)).status).toBe(401);

    const historico = await atendente('GET', `/vehicles/${vehicleId}/history`);
    expect(historico.body.orders.map((o: { id: string }) => o.id)).toContain(order.id);
  });

  it('não permite editar, gerar código nem anonimizar de novo', async () => {
    expect((await atendente('PUT', `/customers/${customerId}`, { name: 'Outro Nome' })).status).toBe(409);
    expect((await atendente('POST', `/customers/${customerId}/access-pin`)).status).toBe(409);
    expect((await admin('POST', `/customers/${customerId}/anonymize`)).status).toBe(409);
  });
});
