import { env } from '../../../config/index.js';
import { GroqProvider } from './groq.js';
import type { LLMProvider } from './types.js';

export { GroqProvider } from './groq.js';
export type { LLMProvider, ChatOptions, ChatResult } from './types.js';

let cachedProvider: LLMProvider | null = null;

export function getProvider(): LLMProvider {
  if (cachedProvider) return cachedProvider;
  switch (env.LLM_PROVIDER) {
    case 'groq':
      cachedProvider = new GroqProvider();
      break;
    case 'anthropic':
      throw new Error('Anthropic provider not yet implemented. Set LLM_PROVIDER=groq.');
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${env.LLM_PROVIDER}`);
  }
  return cachedProvider;
}

export function resetProvider() {
  cachedProvider = null;
}
