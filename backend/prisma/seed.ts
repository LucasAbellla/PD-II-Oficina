import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

// Banco local (docker compose): pode usar a senha padrão e criar os dados de demonstração.
// Banco remoto (produção): exige SEED_ADMIN_PASSWORD e só cria dados de demonstração com SEED_DEMO=true.
const isLocalDb = /@(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//.test(process.env.DATABASE_URL ?? '');

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@oficina.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? (isLocalDb ? 'admin12345' : undefined);
  if (!password || (!isLocalDb && password.length < 12)) {
    throw new Error('Banco remoto: defina SEED_ADMIN_PASSWORD com ao menos 12 caracteres.');
  }
  const withDemo = isLocalDb || process.env.SEED_DEMO === 'true';

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Administrador',
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'ADMIN',
    },
  });

  if (!withDemo) {
    console.log(`Seed concluído. Funcionário: ${email} (sem dados de demonstração)`);
    return;
  }

  // Dados FICTÍCIOS para demonstração (RNF07 - nunca usar dados pessoais reais sem autorização)
  const existingCustomer = await prisma.customer.findFirst({ where: { email: 'cliente@exemplo.com' } });
  const customer = existingCustomer ?? await prisma.customer.create({
    data: {
      name: 'Cliente Exemplo',
      phone: '(51) 90000-0000',
      email: 'cliente@exemplo.com',
      // CPF de teste com dígitos verificadores válidos; não pertence a uma pessoa real.
      document: '529.982.247-25',
      documentDigits: '52998224725',
    },
  });
  // Código de acesso de demonstração para a área do cliente (placa ABC1D23 ou CPF acima + código 123456)
  await prisma.customerAccess.upsert({
    where: { customerId: customer.id },
    update: {},
    create: { customerId: customer.id, pinHash: await bcrypt.hash('123456', 10) },
  });
  const vehicle = await prisma.vehicle.upsert({
    where: { plate: 'ABC1D23' },
    update: {},
    create: { plate: 'ABC1D23', brand: 'Fiat', model: 'Uno', year: 2012, color: 'Prata', customerId: customer.id },
  });
  const existingOrder = await prisma.serviceOrder.findFirst({
    where: { vehicleId: vehicle.id, description: 'Revisão geral e troca de óleo' },
  });
  if (!existingOrder) {
    await prisma.serviceOrder.create({
      data: {
        vehicleId: vehicle.id,
        description: 'Revisão geral e troca de óleo',
        mileageIn: 85000,
        createdById: admin.id,
        items: { create: [{ description: 'Troca de óleo e filtro' }] },
        events: { create: [{ toStatus: 'OPEN', createdById: admin.id }] },
      },
    });
  }
  console.log(`Seed concluído. Funcionário: ${email} | Cliente demo: placa ABC1D23 ou CPF 529.982.247-25, código 123456`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
