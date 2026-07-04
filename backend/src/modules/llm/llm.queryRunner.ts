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

async function checkQuota(studentId: string): Promise<void> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const used = await db.lLMQuery.count({
    where: { studentId, createdAt: { gte: todayStart } },
  });

  if (used >= env.LLM_MAX_QUERIES_PER_DAY) {
    throw new LLMQuotaExceededError(env.LLM_MAX_QUERIES_PER_DAY);
  }
}

export async function runLLMQuery(opts: RunQueryOpts): Promise<RunQueryResult> {
  await checkQuota(opts.studentId);

  const ctx = opts.auditContext;
  const sessionId = ctx.type === 'session' ? ctx.sessionId : undefined;
  const versionId = ctx.type === 'session' ? ctx.versionId : undefined;
  const botId = ctx.type === 'bot' ? ctx.botId : undefined;

  // Input safety
  const inputSafety = await checkSafety(opts.userPrompt, 'input');
  if (!inputSafety.safe) {
    await db.lLMQuery.create({
      data: {
        sessionId,
        versionId,
        botId,
        studentId: opts.studentId,
        userPrompt: opts.userPrompt,
        aiResponse: '',
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
  if (!outputSafety.safe) {
    await db.lLMQuery.create({
      data: {
        sessionId,
        versionId,
        botId,
        studentId: opts.studentId,
        userPrompt: opts.userPrompt,
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

  await db.lLMQuery.create({
    data: {
      sessionId,
      versionId,
      botId,
      studentId: opts.studentId,
      userPrompt: opts.userPrompt,
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
