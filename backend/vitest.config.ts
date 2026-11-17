import { defineConfig } from 'vitest/config';

// Testes unitários (não usam banco). Os de integração ficam em test/.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
