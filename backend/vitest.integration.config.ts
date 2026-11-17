import { defineConfig } from 'vitest/config';
import { testDatabaseUrl } from './test/env';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/global-setup.ts'],
    // Os arquivos compartilham o mesmo banco
    fileParallelism: false,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl,
      JWT_SECRET: 'segredo-de-teste-com-mais-de-16-caracteres',
      CORS_ORIGIN: 'http://localhost:5173',
    },
  },
});
