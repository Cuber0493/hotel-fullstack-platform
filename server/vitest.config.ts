import { defineConfig } from 'vitest/config';

process.env.MSGPACKR_EXTRACT = 'false';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    env: {
      MSGPACKR_EXTRACT: 'false',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/types/**', 'src/scripts/generateRawData.ts'],
    },
  },
});
