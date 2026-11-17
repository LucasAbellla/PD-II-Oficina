import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cliente, criarUsuario, iniciarServidor, limparBanco, login, prisma } from './helpers.js';

let servidor: Awaited<ReturnType<typeof iniciarServidor>>;
let api: ReturnType<typeof cliente>;
let customerId: string;
let vehicleId: string;
const idInexistente = '00000000-0000-4000-8000-000000000000';

async function novaOS() {
  const res = await api('POST', '/service-orders', { vehicleId, description: 'Revisão' });
  return res.body.id as string;
}

async function mudarStatus(id: string, ...status: string[]) {
  let res;
  for (const s of status) res = await api('PATCH', `/service-orders/${id}/status`, { status: s });
  return res!;
}

beforeAll(async () => {
  await limparBanco();
  await criarUsuario('admin@teste.local', 'ADMIN');
  await criarUsuario('atendente@teste.local');
  servidor = await iniciarServidor();
  api = await login(servidor.baseUrl, 'atendente@teste.local');
  customerId = (await api('POST', '/customers', { name: 'Cliente Regras' })).body.id;
  vehicleId = (await api('POST', '/vehicles', { plate: 'XYZ9876', brand: 'VW', model: 'Gol', customerId })).body.id;
});

afterAll(async () => {
  await servidor?.fechar();
  await prisma.$disconnect();
});

describe('autenticação', () => {
  it('recusa senha errada e token inválido', async () => {
    const anonimo = cliente(servidor.baseUrl);
    expect((await anonimo('POST', '/auth/login', { email: 'atendente@teste.local', password: 'errada123' })).status).toBe(401);
    expect((await cliente(servidor.baseUrl, 'token.falso')('GET', '/customers')).status).toBe(401);
  });

  it('bloqueia usuário desativado, inclusive com token já emitido', async () => {
    await criarUsuario('temp@teste.local');
    const temp = await login(servidor.baseUrl, 'temp@teste.local');
    await prisma.user.update({ where: { email: 'temp@teste.local' }, data: { active: false } });

    expect((await temp('GET', '/customers')).status).toBe(401);
    const res = await cliente(servidor.baseUrl)('POST', '/auth/login', { email: 'temp@teste.local', password: 'senha12345' });
    expect(res.status).toBe(403);
  });

  it('troca a própria senha conferindo a atual', async () => {
    await criarUsuario('senha@teste.local');
    const user = await login(servidor.baseUrl, 'senha@teste.local');

    const errada = await user('PATCH', '/auth/me/password', { currentPassword: 'outra1234', newPassword: 'novaSenha123' });
    expect(errada.status).toBe(400);
    expect(errada.body.details[0].field).toBe('currentPassword');

    const ok = await user('PATCH', '/auth/me/password', { currentPassword: 'senha12345', newPassword: 'novaSenha123' });
    expect(ok.status).toBe(204);
    await expect(login(servidor.baseUrl, 'senha@teste.local', 'novaSenha123')).resolves.toBeTypeOf('function');
  });
});

describe('controle de acesso por perfil', () => {
  it('somente ADMIN gerencia usuários', async () => {
    expect((await api('GET', '/auth/users')).status).toBe(403);
    expect((await api('POST', '/auth/users', { name: 'X', email: 'x@teste.local', password: 'senha12345' })).status).toBe(403);
  });

  it('ADMIN cria usuário sem expor a senha e recusa e-mail repetido', async () => {
    const admin = await login(servidor.baseUrl, 'admin@teste.local');
    const novo = { name: 'Novo Atendente', email: 'novo@teste.local', password: 'senha12345' };

    const criado = await admin('POST', '/auth/users', novo);
    expect(criado.status).toBe(201);
    expect(criado.body).toMatchObject({ email: 'novo@teste.local', role: 'ATTENDANT' });
    expect(criado.body).not.toHaveProperty('passwordHash');

    const repetido = await admin('POST', '/auth/users', novo);
    expect(repetido.status).toBe(409);
  });

  it('ADMIN não pode desativar o próprio usuário', async () => {
    const admin = await login(servidor.baseUrl, 'admin@teste.local');
    const me = await admin('GET', '/auth/me');
    const res = await admin('PUT', `/auth/users/${me.body.id}`, { name: 'Admin', role: 'ADMIN', active: false });
    expect(res.status).toBe(409);
  });
});

describe('clientes e veículos', () => {
  it('recusa placa repetida indicando o campo', async () => {
    const res = await api('POST', '/vehicles', { plate: 'xyz9876', brand: 'Fiat', model: 'Palio', customerId });
    expect(res.status).toBe(409);
    expect(res.body.details[0].field).toBe('plate');
  });

  it('recusa placa em formato inválido', async () => {
    const res = await api('POST', '/vehicles', { plate: 'AB-1234', brand: 'Fiat', model: 'Palio', customerId });
    expect(res.status).toBe(400);
  });

  it('não vincula veículo a cliente inexistente', async () => {
    const res = await api('POST', '/vehicles', { plate: 'QWE1234', brand: 'Fiat', model: 'Palio', customerId: idInexistente });
    expect(res.status).toBe(400);
  });

  it('limpa campos opcionais na edição', async () => {
    const criado = await api('POST', '/customers', { name: 'Com Email', email: 'a@b.com', phone: '51999990000' });
    const editado = await api('PUT', `/customers/${criado.body.id}`, { name: 'Com Email', email: '', phone: '' });
    expect(editado.status).toBe(200);
    expect(editado.body).toMatchObject({ email: null, phone: null });
  });

  it('retorna 404 para registro inexistente', async () => {
    expect((await api('GET', `/customers/${idInexistente}`)).status).toBe(404);
    expect((await api('GET', `/vehicles/${idInexistente}/history`)).status).toBe(404);
    expect((await api('GET', `/service-orders/${idInexistente}`)).status).toBe(404);
  });
});

describe('ordens de serviço', () => {
  it('não abre OS para veículo inexistente', async () => {
    const res = await api('POST', '/service-orders', { vehicleId: idInexistente, description: 'Revisão' });
    expect(res.status).toBe(400);
  });

  it('bloqueia transição fora do fluxo', async () => {
    const id = await novaOS();
    expect((await mudarStatus(id, 'DELIVERED')).status).toBe(409);
    expect((await mudarStatus(id, 'COMPLETED')).status).toBe(409);
  });

  it('não cancela OS concluída', async () => {
    const id = await novaOS();
    expect((await mudarStatus(id, 'IN_PROGRESS', 'COMPLETED', 'CANCELED')).status).toBe(409);
  });

  it('reabre OS concluída e limpa a data de encerramento', async () => {
    const id = await novaOS();
    const concluida = await mudarStatus(id, 'IN_PROGRESS', 'COMPLETED');
    expect(concluida.body.closedAt).not.toBeNull();

    const reaberta = await mudarStatus(id, 'IN_PROGRESS');
    expect(reaberta.status).toBe(200);
    expect(reaberta.body.closedAt).toBeNull();
  });

  it('OS entregue ou cancelada não aceita nem remove serviços', async () => {
    const entregue = await novaOS();
    const item = await api('POST', `/service-orders/${entregue}/items`, { description: 'Troca de óleo' });
    await mudarStatus(entregue, 'IN_PROGRESS', 'COMPLETED', 'DELIVERED');
    expect((await api('POST', `/service-orders/${entregue}/items`, { description: 'Filtro' })).status).toBe(409);
    expect((await api('DELETE', `/service-orders/${entregue}/items/${item.body.id}`)).status).toBe(409);

    const cancelada = await novaOS();
    await mudarStatus(cancelada, 'CANCELED');
    expect((await api('POST', `/service-orders/${cancelada}/items`, { description: 'Filtro' })).status).toBe(409);
  });

  it('remove serviço de OS em aberto', async () => {
    const id = await novaOS();
    const item = await api('POST', `/service-orders/${id}/items`, { description: 'Troca de óleo' });
    expect((await api('DELETE', `/service-orders/${id}/items/${item.body.id}`)).status).toBe(204);
    expect((await api('GET', `/service-orders/${id}`)).body.items).toHaveLength(0);
  });
});
