export const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? 'postgresql://oficina:oficina@localhost:5432/oficina_test?schema=public';
