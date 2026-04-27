import { env } from './config/index.js';
import { logger } from './lib/logger.js';
import { db } from './lib/db.js';

async function main() {
  await db.$connect();
  const tenantCount = await db.tenant.count();
  logger.info({ port: env.PORT, env: env.NODE_ENV, tenantCount }, 'TrainBot backend ready');
  await db.$disconnect();
}

main().catch((err) => {
  logger.error(err, 'Startup failed');
  process.exit(1);
});
