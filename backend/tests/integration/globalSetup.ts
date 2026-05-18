import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';
import { execSync } from 'node:child_process';

let container: StartedTestContainer | undefined;

export async function setup() {
  container = await new GenericContainer('postgres:16-alpine')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'test',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections', 2))
    .start();

  const url = `postgresql://test:test@localhost:${container.getMappedPort(5432)}/test?schema=public`;

  process.env.DATABASE_URL = url;
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-must-be-at-least-32-chars-long';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-must-be-at-least-32-chars-long';
  process.env.BCRYPT_ROUNDS = '8';
  process.env.RATE_LIMIT_MAX = '10000';
  process.env.LOG_LEVEL = 'fatal';

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });

  // Make env vars available to forks
  // (provideEnv is the Vitest API for this)
  return async () => {
    if (container) await container.stop();
  };
}
