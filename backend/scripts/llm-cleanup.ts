/**
 * LLM Queries retention cleanup — runs daily via cron.
 * Deletes llm_queries older than LLM_RETENTION_DAYS (default 90).
 * Run: `node dist/scripts/llm-cleanup.js`
 */
import { db } from '../src/lib/db.js';
import { env } from '../src/config/index.js';
import { logger } from '../src/lib/logger.js';

async function main() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - env.LLM_RETENTION_DAYS);

  logger.info({ cutoff: cutoff.toISOString() }, 'Starting LLM retention cleanup');

  const result = await db.lLMQuery.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  logger.info({ deleted: result.count }, 'LLM retention cleanup complete');
  await db.$disconnect();
}

main().catch(async (err) => {
  logger.error({ err }, 'LLM cleanup failed');
  await db.$disconnect();
  process.exit(1);
});
