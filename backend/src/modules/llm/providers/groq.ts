import Groq from 'groq-sdk';
import { env } from '../../../config/index.js';
import { logger } from '../../../lib/logger.js';
import type { ChatOptions, ChatResult, LLMProvider } from './types.js';

export class GroqProvider implements LLMProvider {
  readonly name = 'groq';
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: env.GROQ_API_KEY,
      timeout: env.LLM_GROQ_TIMEOUT_MS,
    });
  }

  async chat(opts: ChatOptions): Promise<ChatResult> {
    const start = Date.now();
    const params = {
      model: env.LLM_MODEL,
      messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: opts.maxTokens ?? 300,
      temperature: opts.temperature ?? 0.7,
    };

    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = (await this.client.chat.completions.create(params as any)) as any;
        const content = response.choices[0]?.message?.content ?? '';
        return {
          content,
          inputTokens: response.usage?.prompt_tokens ?? 0,
          outputTokens: response.usage?.completion_tokens ?? 0,
          latencyMs: Date.now() - start,
        };
      } catch (err: unknown) {
        lastErr = err;
        const status = (err as { status?: number })?.status;
        if (typeof status === 'number' && status >= 500 && attempt === 0) {
          logger.warn({ err, attempt }, 'Groq 5xx, retrying once');
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }
}
