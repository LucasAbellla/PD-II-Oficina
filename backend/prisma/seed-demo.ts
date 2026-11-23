/**
 * Dados FICTÍCIOS para demonstração e capturas de tela (RNF07: nunca usar dados pessoais reais).
 * Cria clientes, veículos e OS em vários status, com eventos espaçados no tempo para o painel
 * exibir tempos médios por etapa. Rode DEPOIS do seed principal:  npm run seed && npm run seed:demo
 * Códigos de acesso de demonstração: todos os clientes abaixo usam o código 123456.
 */
import { PrismaClient, type OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const customers = [
  { name: 'Maria Souza (demo)', phone: '(51) 91111-1111', document: '111.444.777-35', digits: '11144477735',
    vehicles: [{ plate: 'DEM1A11', brand: 'Chevrolet', model: 'Onix', year: 2019, color: 'Branco' }] },
  { name: 'João Pereira (demo)', phone: '(51) 92222-2222', document: '390.533.447-05', digits: '39053344705',
    vehicles: [
      { plate: 'DEM2B22', brand: 'Volkswagen', model: 'Gol', year: 2015, color: 'Preto' },
      { plate: 'DEM3C33', brand: 'Honda', model: 'Civic', year: 2017, color: 'Cinza' },
    ] },
  { name: 'Ana Lima (demo)', phone: '(51) 93333-3333', document: '935.411.347-80', digits: '93541134780',
    vehicles: [{ plate: 'DEM4D44', brand: 'Renault', model: 'Kwid', year: 2021, color: 'Vermelho' }] },
];

// [placa, problema, serviços, status final, horas até iniciar, horas em andamento, horas até entregar, dias atrás]
const orders: [string, string, string[], OrderStatus, number, number, number, number][] = [
  ['DEM1A11', 'Barulho ao frear', ['Troca de pastilhas de freio'], 'DELIVERED', 1, 3, 20, 14],
  ['DEM2B22', 'Revisão dos 60 mil km', ['Troca de óleo e filtro', 'Alinhamento e balanceamento'], 'DELIVERED', 2, 5, 6, 9],
  ['DEM2B22', 'Luz da injeção acesa', ['Diagnóstico elétrico'], 'COMPLETED', 1, 4, 0, 3],
  ['DEM3C33', 'Troca de correia dentada', ['Troca de correia dentada'], 'IN_PROGRESS', 2, 0, 0, 1],
  ['DEM4D44', 'Ar-condicionado não gela', [], 'OPEN', 0, 0, 0, 0],
  ['DEM1A11', 'Cliente desistiu do orçamento', [], 'CANCELED', 1, 0, 0, 20],
];

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('Rode primeiro: npm run seed');
  const pinHash = await bcrypt.hash('123456', 10);

  for (const c of customers) {
    let customer = await prisma.customer.findFirst({ where: { documentDigits: c.digits } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name: c.name, phone: c.phone, document: c.document, documentDigits: c.digits, access: { create: { pinHash } } },
      });
    }
    for (const v of c.vehicles) {
      await prisma.vehicle.upsert({ where: { plate: v.plate }, update: {}, create: { ...v, customerId: customer.id } });
    }
  }

  for (const [plate, description, services, status, toStart, inProgress, toDeliver, daysAgo] of orders) {
    const vehicle = await prisma.vehicle.findUniqueOrThrow({ where: { plate } });
    if (await prisma.serviceOrder.findFirst({ where: { vehicleId: vehicle.id, description } })) continue;

    const opened = new Date(Date.now() - daysAgo * DAY);
    const events: { from: OrderStatus | null; to: OrderStatus; at: Date }[] = [{ from: null, to: 'OPEN', at: opened }];
    let t = opened.getTime();
    const push = (to: OrderStatus, afterHours: number) => {
      const from = events[events.length - 1].to;
      t += afterHours * HOUR;
      events.push({ from, to, at: new Date(t) });
    };
    if (status === 'CANCELED') push('CANCELED', toStart);
    if (['IN_PROGRESS', 'COMPLETED', 'DELIVERED'].includes(status)) push('IN_PROGRESS', toStart);
    if (['COMPLETED', 'DELIVERED'].includes(status)) push('COMPLETED', inProgress);
    if (status === 'DELIVERED') push('DELIVERED', toDeliver);
    const last = events[events.length - 1];

    await prisma.serviceOrder.create({
      data: {
        vehicleId: vehicle.id,
        description,
        mileageIn: 40000 + Math.floor(Math.random() * 60000),
        status,
        openedAt: opened,
        closedAt: ['COMPLETED', 'DELIVERED', 'CANCELED'].includes(status) ? last.at : null,
        createdById: admin.id,
        items: { create: services.map((d, i) => ({ description: d, performedAt: new Date(opened.getTime() + (i + 1) * HOUR) })) },
        events: { create: events.map((e) => ({ fromStatus: e.from, toStatus: e.to, createdAt: e.at, createdById: admin.id })) },
      },
    });
  }
  console.log('Demo criada: clientes (código 123456), veículos e OS em vários status.');
}

main().finally(() => prisma.$disconnect());
