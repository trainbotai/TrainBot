import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    globalSetup: ['./tests/integration/globalSetup.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
