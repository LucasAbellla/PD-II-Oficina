import { execSync } from 'node:child_process';
import { testDatabaseUrl } from './env';

// Recria o banco de teste e aplica as migrações antes da suíte
export default function setup() {
  const dbName = new URL(testDatabaseUrl).pathname.slice(1);
  if (!dbName.endsWith('_test')) {
    throw new Error(`O banco de teste deve terminar com "_test" (recebido: "${dbName}")`);
  }
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  });
}
