import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@oficina.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin12345';

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

  // Dados FICTÍCIOS para demonstração (RNF07 - nunca usar dados pessoais reais sem autorização)
  const existingCustomer = await prisma.customer.findFirst({ where: { email: 'cliente@exemplo.com' } });
  const customer = existingCustomer ?? await prisma.customer.create({
    data: { name: 'Cliente Exemplo', phone: '(51) 90000-0000', email: 'cliente@exemplo.com' },
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
      },
    });
  }
  console.log(`Seed concluído. Login: ${email}`);
}

main().finally(() => prisma.$disconnect());
