import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { clientJwtSecret } from '../src/config/env.js';
import { cliente, criarUsuario, iniciarServidor, limparBanco, login, prisma } from './helpers.js';

let servidor: Awaited<ReturnType<typeof iniciarServidor>>;
let api: ReturnType<typeof cliente>;
let tokenFuncionario: string;

// Cliente A tem dois veículos; o cliente B é de outra pessoa
const A = { cpf: '123.456.789-09', placa1: 'CLA1A11', placa2: 'CLA2B22' } as const;
const B = { cpf: '987.654.321-00', placa: 'CLB3C33' } as const;
let ids: { a: string; b: string; v1: string; v2: string; vb: string; os1: string; os2: string; osB: string };
let pinA: string;
let pinB: string;

const PDF = Buffer.from('%PDF-1.4\n% nota de teste\n%%EOF\n', 'latin1');

async function criarOS(vehicleId: string, ...status: string[]) {
  const id = (await api('POST', '/service-orders', { vehicleId, description: 'Revisão' })).body.id as string;
  for (const s of status) await api('PATCH', `/service-orders/${id}/status`, { status: s });
  return id;
}

/** Envia o PDF como o frontend faz (corpo cru + nome no cabeçalho). */
async function enviarNota(orderId: string, conteudo: Buffer, tipo = 'application/pdf') {
  const res = await fetch(`${servidor.baseUrl}/service-orders/${orderId}/invoice`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenFuncionario}`, 'Content-Type': tipo, 'X-File-Name': 'nota.pdf' },
    body: new Uint8Array(conteudo),
  });
  return res.status;
}

async function baixar(path: string, token: string) {
  const res = await fetch(`${servidor.baseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return { status: res.status, tipo: res.headers.get('content-type'), corpo: Buffer.from(await res.arrayBuffer()) };
}

/** Sessão de cliente no mesmo formato emitido pelo login (a cota de login por IP é usada no primeiro bloco). */
const sessaoDoCliente = (customerId: string) => jwt.sign({ typ: 'client', cid: customerId }, clientJwtSecret, { expiresIn: '2h' });

async function entrar(identifier: string, pin: string) {
  return cliente(servidor.baseUrl)<{ token: string; scope: string; error?: string }>('POST', '/client/login', { identifier, pin });
}

beforeAll(async () => {
  await limparBanco();
  await criarUsuario('atendente@teste.local');
  servidor = await iniciarServidor();
  const res = await cliente(servidor.baseUrl)('POST', '/auth/login', { email: 'atendente@teste.local', password: 'senha12345' });
  tokenFuncionario = res.body.token;
  api = await login(servidor.baseUrl, 'atendente@teste.local');

  const a = (await api('POST', '/customers', { name: 'Cliente A', document: A.cpf })).body.id;
  const b = (await api('POST', '/customers', { name: 'Cliente B', document: B.cpf, phone: '(51) 99999-0000' })).body.id;
  const v1 = (await api('POST', '/vehicles', { plate: A.placa1, brand: 'Fiat', model: 'Uno', customerId: a })).body.id;
  const v2 = (await api('POST', '/vehicles', { plate: A.placa2, brand: 'VW', model: 'Fox', customerId: a })).body.id;
  const vb = (await api('POST', '/vehicles', { plate: B.placa, brand: 'Ford', model: 'Ka', customerId: b })).body.id;
  const os1 = await criarOS(v1, 'IN_PROGRESS', 'COMPLETED');
  const os2 = await criarOS(v2, 'IN_PROGRESS', 'COMPLETED');
  const osB = await criarOS(vb, 'IN_PROGRESS', 'COMPLETED');
  ids = { a, b, v1, v2, vb, os1, os2, osB };

  pinA = (await api('POST', `/customers/${a}/access-pin`)).body.pin;
  pinB = (await api('POST', `/customers/${b}/access-pin`)).body.pin;
  for (const os of [os1, os2, osB]) expect(await enviarNota(os, PDF)).toBe(201);
});

afterAll(async () => {
  await servidor?.fechar();
  await prisma.$disconnect();
});

// O login do cliente aceita 10 tentativas a cada 15 min por IP; os testes abaixo usam essa cota.
describe('login do cliente', () => {
  it('pela placa dá acesso só àquele veículo', async () => {
    const res = await entrar(A.placa1.toLowerCase(), pinA);
    expect(res.status).toBe(200);
    expect(res.body.scope).toBe('vehicle');
    const area = cliente(servidor.baseUrl, res.body.token);
    const lista = await area('GET', '/client/vehicles');
    expect(lista.body.vehicles.map((v: { plate: string }) => v.plate)).toEqual([A.placa1]);
    expect((await area('GET', `/client/vehicles/${ids.v2}`)).status).toBe(404);
  });

  it('pelo CPF dá acesso a todos os veículos do cliente', async () => {
    const res = await entrar(A.cpf, pinA);
    expect(res.status).toBe(200);
    expect(res.body.scope).toBe('customer');
    const lista = await cliente(servidor.baseUrl, res.body.token)('GET', '/client/vehicles');
    expect(lista.body.vehicles.map((v: { plate: string }) => v.plate)).toEqual([A.placa1, A.placa2]);
  });

  it('responde com a mesma mensagem para código errado e cadastro inexistente', async () => {
    const errado = await entrar(A.placa1, pinA === '111111' ? '222222' : '111111');
    const inexistente = await entrar('ZZZ9Z99', pinA);
    expect(errado.status).toBe(401);
    expect(inexistente.status).toBe(401);
    expect(inexistente.body.error).toBe(errado.body.error);
  });

  it('bloqueia o cliente por 15 minutos após 5 códigos errados', async () => {
    const errado = pinB === '111111' ? '222222' : '111111';
    for (let i = 0; i < 5; i++) expect((await entrar(B.placa, errado)).status).toBe(401);
    expect((await entrar(B.placa, pinB)).status).toBe(401);
    const acesso = await prisma.customerAccess.findUniqueOrThrow({ where: { customerId: ids.b } });
    expect(acesso.lockedUntil!.getTime()).toBeGreaterThan(Date.now() + 14 * 60_000);
  });

  it('limita as tentativas por IP', async () => {
    let status = 0;
    for (let i = 0; i < 11 && status !== 429; i++) status = (await entrar('ZZZ9Z99', '000000')).status;
    expect(status).toBe(429);
  });
});

describe('escopo do token do cliente', () => {
  const tokenA = () => sessaoDoCliente(ids.a);

  it('não acessa veículo nem nota fiscal de outro cliente', async () => {
    const area = cliente(servidor.baseUrl, tokenA());
    expect((await area('GET', `/client/vehicles/${ids.vb}`)).status).toBe(404);
    expect((await baixar(`/client/orders/${ids.osB}/invoice`, tokenA())).status).toBe(404);
  });

  it('token de cliente não vale nas rotas de funcionário e vice-versa', async () => {
    expect((await cliente(servidor.baseUrl, tokenA())('GET', '/customers')).status).toBe(401);
    expect((await cliente(servidor.baseUrl, tokenFuncionario)('GET', '/client/vehicles')).status).toBe(401);
  });

  it('não expõe CPF, telefone nem observações na área do cliente', async () => {
    const res = await cliente(servidor.baseUrl, tokenA())('GET', `/client/vehicles/${ids.v1}`);
    expect(res.status).toBe(200);
    const texto = JSON.stringify(res.body);
    expect(texto).not.toContain('123.456.789-09');
    expect(texto).not.toContain('12345678909');
    expect(texto).not.toContain('atendente');
  });
});

describe('nota fiscal', () => {
  const tokenA = () => sessaoDoCliente(ids.a);

  it('o cliente baixa a nota da própria OS pronta', async () => {
    const res = await baixar(`/client/orders/${ids.os1}/invoice`, tokenA());
    expect(res.status).toBe(200);
    expect(res.tipo).toContain('application/pdf');
    expect(res.corpo.equals(PDF)).toBe(true);
  });

  it('recusa arquivo que não é PDF e arquivo maior que 5 MB', async () => {
    expect(await enviarNota(ids.os1, Buffer.from('isto não é um pdf'))).toBe(400);
    const grande = Buffer.concat([PDF, Buffer.alloc(5 * 1024 * 1024)]);
    expect(await enviarNota(ids.os1, grande)).toBe(413);
    // a nota anterior continua intacta
    expect((await baixar(`/service-orders/${ids.os1}/invoice`, tokenFuncionario)).corpo.equals(PDF)).toBe(true);
  });

  it('não aceita nota com a OS em aberto', async () => {
    const aberta = await criarOS(ids.v1);
    expect(await enviarNota(aberta, PDF)).toBe(409);
  });

  it('a nota some da área do cliente quando a OS é reaberta ou a nota é removida', async () => {
    await api('PATCH', `/service-orders/${ids.os2}/status`, { status: 'IN_PROGRESS' });
    expect((await baixar(`/client/orders/${ids.os2}/invoice`, tokenA())).status).toBe(404);
    const detalhe = await cliente(servidor.baseUrl, tokenA())('GET', `/client/vehicles/${ids.v2}`);
    expect(detalhe.body.orders[0].invoice).toBeNull();

    expect((await api('DELETE', `/service-orders/${ids.os1}/invoice`)).status).toBe(204);
    expect((await baixar(`/client/orders/${ids.os1}/invoice`, tokenA())).status).toBe(404);
  });
});

describe('link público de acompanhamento', () => {
  const abrir = (token: string) => cliente(servidor.baseUrl)('GET', `/public/orders/${token}`);

  it('mostra a OS com a placa oculta e sem dados pessoais', async () => {
    const { token } = (await api('POST', `/service-orders/${ids.osB}/share`)).body;
    const res = await abrir(token);
    expect(res.status).toBe(200);
    expect(res.body.vehicle.plate).not.toBe(B.placa);
    const texto = JSON.stringify(res.body);
    expect(texto).not.toContain('Cliente B');
    expect(texto).not.toContain('99999');
    expect(texto).not.toContain('98765432100');
  });

  it('um novo link invalida o anterior', async () => {
    const antigo = (await api('POST', `/service-orders/${ids.osB}/share`)).body.token;
    const novo = (await api('POST', `/service-orders/${ids.osB}/share`)).body.token;
    expect((await abrir(antigo)).status).toBe(404);
    expect((await abrir(novo)).status).toBe(200);
  });

  it('link revogado, expirado ou malformado responde 404', async () => {
    const revogado = (await api('POST', `/service-orders/${ids.osB}/share`)).body.token;
    expect((await api('DELETE', `/service-orders/${ids.osB}/share`)).status).toBe(204);
    expect((await abrir(revogado)).status).toBe(404);

    const expirado = (await api('POST', `/service-orders/${ids.osB}/share`)).body.token;
    await prisma.serviceOrder.update({ where: { id: ids.osB }, data: { publicTokenExpiresAt: new Date(Date.now() - 1000) } });
    expect((await abrir(expirado)).status).toBe(404);

    expect((await abrir('curto')).status).toBe(404);
  });
});
