import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    // Valori dummy: env.ts face process.exit(1) fără ele (checkout curat, fără .env).
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_ACCESS_SECRET: 'unit-test-access-secret-0123456789abcdef',
      JWT_REFRESH_SECRET: 'unit-test-refresh-secret-0123456789abcdef',
      GROQ_API_KEY: 'unit-test-groq-key',
      OPENAI_API_KEY: 'unit-test-openai-key',
      LOG_LEVEL: 'fatal',
    },
    include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
