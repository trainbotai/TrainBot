/**
 * Shared LLM query runner — reused by student sessions AND teacher demo bots.
 * Encapsulates: quota check, input safety, prompt build, provider call, output safety, audit log.
 */
import { db } from '../../lib/db.js';
import {
  LLMQuotaExceededError,
  LLMContentBlockedInputError,
  LLMContentBlockedOutputError,
  LLMProviderUnavailableError,
  LLMModerationUnavailableError,
} from '../../lib/errors.js';
import { env } from '../../config/index.js';
import { logger } from '../../lib/logger.js';
import { checkSafety } from './safety/pipeline.js';
import { buildPrompt } from './prompt/builder.js';
import { getProvider } from './providers/index.js';
import type { Example } from './llm.types.js';

export interface RunQueryOpts {
  studentId: string;
  userPrompt: string;
  examples: Example[];
  /** Instrucțiunea profesorului (doar boți demo). */
  instruction?: string;
  auditContext:
    | { type: 'session'; sessionId: string; versionId: string }
    | { type: 'bot'; botId: string };
}

export interface RunQueryResult {
  response: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Rezervă o intrare de quota ÎNAINTE de apelul Groq. Count + insert rulează într-o
 * tranzacție sub un advisory lock per elev, deci cereri paralele nu mai pot depăși limita.
 * Rândul rezervat e completat la final (update) sau șters dacă cererea eșuează fără efect.
 */
async function reserveQuota(
  opts: RunQueryOpts,
  ids: { sessionId?: string; versionId?: string; botId?: string },
): Promise<string> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${opts.studentId}))`;
    const used = await tx.lLMQuery.count({
      where: { studentId: opts.studentId, createdAt: { gte: todayStart } },
    });
    if (used >= env.LLM_MAX_QUERIES_PER_DAY) {
      throw new LLMQuotaExceededError(env.LLM_MAX_QUERIES_PER_DAY);
    }
    const row = await tx.lLMQuery.create({
      data: { ...ids, studentId: opts.studentId, userPrompt: opts.userPrompt, aiResponse: '' },
    });
    return row.id;
  });
}

async function releaseQuota(id: string): Promise<void> {
  try {
    await db.lLMQuery.delete({ where: { id } });
  } catch (err) {
    logger.error({ err, queryId: id }, 'Failed to release reserved LLM quota row');
  }
}

export async function runLLMQuery(opts: RunQueryOpts): Promise<RunQueryResult> {
  const ctx = opts.auditContext;
  const ids = {
    sessionId: ctx.type === 'session' ? ctx.sessionId : undefined,
    versionId: ctx.type === 'session' ? ctx.versionId : undefined,
    botId: ctx.type === 'bot' ? ctx.botId : undefined,
  };

  const queryId = await reserveQuota(opts, ids);
  try {
    return await runReserved(opts, queryId);
  } catch (err) {
    // Blocările de conținut consumă quota (rândul e completat în runReserved);
    // orice altă eroare (moderare/Groq indisponibile) eliberează rezervarea.
    if (
      !(err instanceof LLMContentBlockedInputError) &&
      !(err instanceof LLMContentBlockedOutputError)
    ) {
      await releaseQuota(queryId);
    }
    throw err;
  }
}

async function runReserved(opts: RunQueryOpts, queryId: string): Promise<RunQueryResult> {
  // Input safety
  const inputSafety = await checkSafety(opts.userPrompt, 'input');
  if (inputSafety.reason === 'unavailable') throw new LLMModerationUnavailableError();
  if (!inputSafety.safe) {
    await db.lLMQuery.update({
      where: { id: queryId },
      data: {
        inputModerationFlagged: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        moderationCategories: inputSafety.categories ? (inputSafety.categories as any) : null,
      },
    });
    throw new LLMContentBlockedInputError();
  }

  const messages = buildPrompt({ examples: opts.examples, userQuery: opts.userPrompt, instruction: opts.instruction });

  const provider = getProvider();
  let chatResult;
  try {
    chatResult = await provider.chat({ messages, maxTokens: 300 });
  } catch (err) {
    logger.error({ err, auditContext: opts.auditContext }, 'LLM provider failed');
    throw new LLMProviderUnavailableError();
  }

  // Output safety
  const outputSafety = await checkSafety(chatResult.content, 'output');
  if (outputSafety.reason === 'unavailable') throw new LLMModerationUnavailableError();
  if (!outputSafety.safe) {
    await db.lLMQuery.update({
      where: { id: queryId },
      data: {
        aiResponse: chatResult.content,
        outputModerationFlagged: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        moderationCategories: outputSafety.categories ? (outputSafety.categories as any) : null,
        inputTokens: chatResult.inputTokens,
        outputTokens: chatResult.outputTokens,
        groqLatencyMs: chatResult.latencyMs,
      },
    });
    throw new LLMContentBlockedOutputError();
  }

  await db.lLMQuery.update({
    where: { id: queryId },
    data: {
      aiResponse: chatResult.content,
      inputTokens: chatResult.inputTokens,
      outputTokens: chatResult.outputTokens,
      groqLatencyMs: chatResult.latencyMs,
    },
  });

  return {
    response: chatResult.content,
    inputTokens: chatResult.inputTokens,
    outputTokens: chatResult.outputTokens,
  };
}
