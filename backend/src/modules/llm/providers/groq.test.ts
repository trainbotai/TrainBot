import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../config/index.js', () => ({
  env: {
    GROQ_API_KEY: 'test-key',
    LLM_MODEL: 'llama-3.3-70b-versatile',
    LLM_GROQ_TIMEOUT_MS: 10000,
  },
}));
vi.mock('../../../lib/logger.js', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('groq-sdk', () => {
  const mockCreate = vi.fn();
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    })),
    __mockCreate: mockCreate,
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const groqModule = (await import('groq-sdk')) as any;
const mockCreate = groqModule.__mockCreate;
const { GroqProvider } = await import('./groq.js');

beforeEach(() => {
  mockCreate.mockReset();
});

describe('GroqProvider', () => {
  it('returns content + token counts + latency', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Salut copil!' } }],
      usage: { prompt_tokens: 100, completion_tokens: 20 },
    });
    const provider = new GroqProvider();
    const result = await provider.chat({
      messages: [
        { role: 'system', content: 'system' },
        { role: 'user', content: 'Salut' },
      ],
    });
    expect(result.content).toBe('Salut copil!');
    expect(result.inputTokens).toBe(100);
    expect(result.outputTokens).toBe(20);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('retries once on 5xx error', async () => {
    const err = Object.assign(new Error('Server error'), { status: 503 });
    mockCreate
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'Salut' } }],
        usage: { prompt_tokens: 50, completion_tokens: 10 },
      });
    const provider = new GroqProvider();
    const result = await provider.chat({
      messages: [{ role: 'user', content: 'Salut' }],
    });
    expect(result.content).toBe('Salut');
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('throws after second retry failure', async () => {
    const err = Object.assign(new Error('Server error'), { status: 503 });
    mockCreate.mockRejectedValue(err);
    const provider = new GroqProvider();
    await expect(
      provider.chat({ messages: [{ role: 'user', content: 'Salut' }] }),
    ).rejects.toThrow();
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 4xx', async () => {
    const err = Object.assign(new Error('Bad request'), { status: 400 });
    mockCreate.mockRejectedValueOnce(err);
    const provider = new GroqProvider();
    await expect(
      provider.chat({ messages: [{ role: 'user', content: 'Salut' }] }),
    ).rejects.toThrow();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('has name "groq"', () => {
    expect(new GroqProvider().name).toBe('groq');
  });
});
