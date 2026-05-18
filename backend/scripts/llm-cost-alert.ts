/**
 * LLM cost alert — runs daily 23:00 UTC via cron.
 * Warns if daily token total approaches Groq free tier limit (500k TPD).
 * Run: `node dist/scripts/llm-cost-alert.js`
 */
import { db } from '../src/lib/db.js';
import { logger } from '../src/lib/logger.js';

const GROQ_FREE_TPD_LIMIT = 500_000;
const ALERT_THRESHOLD = 0.8;

async function main() {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const result = await db.lLMQuery.aggregate({
    where: { createdAt: { gte: todayStart } },
    _sum: { inputTokens: true, outputTokens: true },
    _count: true,
  });

  const totalTokens =
    (result._sum.inputTokens ?? 0) + (result._sum.outputTokens ?? 0);
  const usagePct = totalTokens / GROQ_FREE_TPD_LIMIT;
  const queries = result._count;

  logger.info(
    {
      day: todayStart.toISOString().slice(0, 10),
      queries,
      totalTokens,
      usagePct: Math.round(usagePct * 100),
      limit: GROQ_FREE_TPD_LIMIT,
    },
    'LLM daily usage report',
  );

  if (usagePct >= ALERT_THRESHOLD) {
    logger.warn(
      {
        usagePct: Math.round(usagePct * 100),
        totalTokens,
        limit: GROQ_FREE_TPD_LIMIT,
      },
      `ALERT: Groq free tier daily usage at ${Math.round(usagePct * 100)}%`,
    );
  }

  await db.$disconnect();
}

main().catch(async (err) => {
  logger.error({ err }, 'LLM cost alert failed');
  await db.$disconnect();
  process.exit(1);
});
