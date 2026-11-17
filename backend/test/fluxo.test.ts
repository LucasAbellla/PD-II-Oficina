import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cliente, criarUsuario, iniciarServidor, limparBanco, login, prisma } from './helpers.js';

// Mesmo roteiro da validação com a oficina (T1 a T6)
describe('fluxo principal: cliente → veículo → OS → histórico', () => {
  let servidor: Awaited<ReturnType<typeof iniciarServidor>>;
  let api: ReturnType<typeof cliente>;
  let userId: string;
  let customerId: string;
  let vehicleId: string;
  let orderId: string;
  let orderNumber: number;

  beforeAll(async () => {
    await limparBanco();
    userId = (await criarUsuario('atendente@teste.local')).id;
    servidor = await iniciarServidor();
    api = await login(servidor.baseUrl, 'atendente@teste.local');
  });

  afterAll(async () => {
    await servidor?.fechar();
    await prisma.$disconnect();
  });

  it('T1: cadastra cliente e veículo vinculado', async () => {
    const c = await api('POST', '/customers', { name: 'Maria Teste', phone: '(51) 98888-7777' });
    expect(c.status).toBe(201);
    customerId = c.body.id;

    const v = await api('POST', '/vehicles', { plate: 'abc1d23', brand: 'Fiat', model: 'Uno', year: 2015, customerId });
    expect(v.status).toBe(201);
    expect(v.body.plate).toBe('ABC1D23');
    vehicleId = v.body.id;

    const detalhe = await api('GET', `/customers/${customerId}`);
    expect(detalhe.body.vehicles).toHaveLength(1);
  });

  it('T2: abre OS para o veículo', async () => {
    const res = await api('POST', '/service-orders', { vehicleId, description: 'Barulho na suspensão', mileageIn: 120000 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: 'OPEN', createdById: userId, mileageIn: 120000 });
    orderId = res.body.id;
    orderNumber = res.body.number;
  });

  it('T3: registra dois serviços na OS', async () => {
    for (const description of ['Troca de amortecedores', 'Alinhamento']) {
      expect((await api('POST', `/service-orders/${orderId}/items`, { description })).status).toBe(201);
    }
    const os = await api('GET', `/service-orders/${orderId}`);
    expect(os.body.items.map((i: { description: string }) => i.description)).toEqual([
      'Troca de amortecedores',
      'Alinhamento',
    ]);
    expect(os.body.allowedTransitions).toEqual(['IN_PROGRESS', 'CANCELED']);
  });

  it('T4: avança o status até Entregue', async () => {
    for (const status of ['IN_PROGRESS', 'COMPLETED', 'DELIVERED']) {
      const res = await api('PATCH', `/service-orders/${orderId}/status`, { status });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }
    const os = await api('GET', `/service-orders/${orderId}`);
    expect(os.body.closedAt).not.toBeNull();
    expect(os.body.allowedTransitions).toEqual([]);
  });

  it('T5: consulta o histórico do veículo', async () => {
    const res = await api('GET', `/vehicles/${vehicleId}/history`);
    expect(res.status).toBe(200);
    expect(res.body.vehicle.customer.name).toBe('Maria Teste');
    expect(res.body.orders).toHaveLength(1);
    expect(res.body.orders[0]).toMatchObject({ number: orderNumber, status: 'DELIVERED' });
    expect(res.body.orders[0].items).toHaveLength(2);
  });

  it('T6: localiza cliente, veículo e OS pela busca', async () => {
    const porNome = await api('GET', '/customers?search=maria');
    expect(porNome.body.data.map((c: { id: string }) => c.id)).toContain(customerId);

    const porPlaca = await api('GET', '/customers?search=abc1d');
    expect(porPlaca.body.data.map((c: { id: string }) => c.id)).toContain(customerId);

    const veiculos = await api('GET', '/vehicles?search=uno');
    expect(veiculos.body.data[0]).toMatchObject({ id: vehicleId, customer: { name: 'Maria Teste' } });

    const ordens = await api('GET', `/service-orders?search=${orderNumber}`);
    expect(ordens.body.data.map((o: { id: string }) => o.id)).toEqual([orderId]);
  });

  it('resume as OS por status', async () => {
    const res = await api('GET', '/service-orders/summary');
    expect(res.body).toEqual({ OPEN: 0, IN_PROGRESS: 0, COMPLETED: 0, DELIVERED: 1, CANCELED: 0 });

    const filtradas = await api('GET', '/service-orders?status=DELIVERED');
    expect(filtradas.body.meta.total).toBe(1);
  });
});
