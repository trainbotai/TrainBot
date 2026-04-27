import { env } from './config/index.js';
import { logger } from './lib/logger.js';
import { db } from './lib/db.js';
import { createApp } from './app.js';

async function main() {
  await db.$connect();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'TrainBot backend listening');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close();
    await db.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error(err, 'Startup failed');
  process.exit(1);
});
