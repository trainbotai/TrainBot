import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../config/index.js', () => ({
  env: {
    OPENAI_API_KEY: 'test-key',
    NODE_ENV: 'test',
    LOG_LEVEL: 'fatal',
  },
}));

vi.mock('../../../lib/logger.js', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('openai', () => {
  const mockModerationsCreate = vi.fn();
  return {
    default: vi.fn().mockImplementation(() => ({
      moderations: { create: mockModerationsCreate },
    })),
    __mockCreate: mockModerationsCreate,
  };
});

const { checkModeration, INPUT_THRESHOLDS, OUTPUT_THRESHOLDS } = await import('./moderation.js');
void INPUT_THRESHOLDS;
void OUTPUT_THRESHOLDS;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const openaiModule = (await import('openai')) as any;
const mockCreate = openaiModule.__mockCreate;

beforeEach(() => {
  mockCreate.mockReset();
});

describe('checkModeration', () => {
  it('passes safe content with low scores', async () => {
    mockCreate.mockResolvedValueOnce({
      results: [{
        flagged: false,
        category_scores: {
          sexual: 0.01, 'sexual/minors': 0.001, harassment: 0.02,
          hate: 0.01, 'self-harm': 0.01, violence: 0.01,
        },
      }],
    });
    const result = await checkModeration('Salut robot!', 'input');
    expect(result.safe).toBe(true);
  });

  it('blocks input above threshold', async () => {
    mockCreate.mockResolvedValueOnce({
      results: [{
        flagged: true,
        category_scores: {
          violence: 0.9, 'sexual/minors': 0.0, sexual: 0.05, harassment: 0.1,
        },
      }],
    });
    const result = await checkModeration('graphic violence text', 'input');
    expect(result.safe).toBe(false);
    expect(result.categories).toBeDefined();
  });

  it('uses stricter output thresholds', async () => {
    mockCreate.mockResolvedValueOnce({
      results: [{ flagged: false, category_scores: { violence: 0.6, 'sexual/minors': 0.0, sexual: 0.0 } }],
    });
    const inputResult = await checkModeration('text', 'input');
    expect(inputResult.safe).toBe(true);

    mockCreate.mockResolvedValueOnce({
      results: [{ flagged: false, category_scores: { violence: 0.6, 'sexual/minors': 0.0, sexual: 0.0 } }],
    });
    const outputResult = await checkModeration('text', 'output');
    expect(outputResult.safe).toBe(false);
  });

  it('fail-safe BLOCKS on API error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API down'));
    const result = await checkModeration('text', 'input');
    expect(result.safe).toBe(false);
    expect(result.error).toBe(true);
  });

  it('zero tolerance on sexual/minors regardless of direction', async () => {
    mockCreate.mockResolvedValueOnce({
      results: [{ flagged: false, category_scores: { 'sexual/minors': 0.15, sexual: 0.05, violence: 0.0 } }],
    });
    const result = await checkModeration('text', 'input');
    expect(result.safe).toBe(false);
  });
});
