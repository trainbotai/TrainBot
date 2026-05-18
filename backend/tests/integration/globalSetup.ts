import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';
import { execSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

let container: StartedTestContainer | undefined;
let tmpUploadDir: string | undefined;

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
  process.env.GROQ_API_KEY = 'test-groq-key';
  process.env.OPENAI_API_KEY = 'test-openai-key';

  tmpUploadDir = path.join(os.tmpdir(), `trainbot-test-uploads-${Date.now()}`);
  await fs.mkdir(tmpUploadDir, { recursive: true });
  process.env.UPLOAD_DIR = tmpUploadDir;

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });

  // Make env vars available to forks
  // (provideEnv is the Vitest API for this)
  return async () => {
    if (container) await container.stop();
    if (tmpUploadDir) await fs.rm(tmpUploadDir, { recursive: true, force: true });
  };
}
