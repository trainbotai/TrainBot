import type { ChatMessage } from '../prompt/builder.js';

export interface ChatOptions {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface ChatResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface LLMProvider {
  readonly name: string;
  chat(opts: ChatOptions): Promise<ChatResult>;
}
