import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  LLMQuotaExceededError,
  LLMModerationUnavailableError,
  LLMProviderUnavailableError,
  LLMContentBlockedInputError,
} from '../../lib/errors.js';

const tx = {
  $executeRaw: vi.fn(),
  lLMQuery: { count: vi.fn(), create: vi.fn() },
};
const dbMock = {
  $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  lLMQuery: { update: vi.fn(), delete: vi.fn() },
};
vi.mock('../../lib/db.js', () => ({ db: dbMock }));
vi.mock('./safety/pipeline.js', () => ({ checkSafety: vi.fn() }));
vi.mock('./providers/index.js', () => ({ getProvider: vi.fn() }));

const { checkSafety } = await import('./safety/pipeline.js');
const { getProvider } = await import('./providers/index.js');
const { runLLMQuery } = await import('./llm.queryRunner.js');

const opts = {
  studentId: 's1',
  userPrompt: 'salut',
  examples: [],
  auditContext: { type: 'bot' as const, botId: 'b1' },
};

beforeEach(() => {
  vi.clearAllMocks();
  tx.lLMQuery.count.mockResolvedValue(0);
  tx.lLMQuery.create.mockResolvedValue({ id: 'q1' });
});

describe('runLLMQuery quota reservation', () => {
  it('reserves the row under a lock before calling the provider', async () => {
    const chat = vi.fn().mockResolvedValue({ content: 'hi', inputTokens: 1, outputTokens: 2, latencyMs: 3 });
    vi.mocked(getProvider).mockReturnValue({ chat } as never);
    vi.mocked(checkSafety).mockResolvedValue({ safe: true });

    await runLLMQuery(opts);

    expect(tx.$executeRaw).toHaveBeenCalled();
    expect(tx.lLMQuery.create.mock.invocationCallOrder[0]).toBeLessThan(chat.mock.invocationCallOrder[0]!);
    expect(dbMock.lLMQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'q1' } }),
    );
    expect(dbMock.lLMQuery.delete).not.toHaveBeenCalled();
  });

  it('rejects at the limit without reserving or calling the provider', async () => {
    tx.lLMQuery.count.mockResolvedValue(10_000);
    await expect(runLLMQuery(opts)).rejects.toBeInstanceOf(LLMQuotaExceededError);
    expect(tx.lLMQuery.create).not.toHaveBeenCalled();
    expect(getProvider).not.toHaveBeenCalled();
  });

  it('releases the reservation when the provider fails', async () => {
    vi.mocked(checkSafety).mockResolvedValue({ safe: true });
    vi.mocked(getProvider).mockReturnValue({ chat: vi.fn().mockRejectedValue(new Error('x')) } as never);
    await expect(runLLMQuery(opts)).rejects.toBeInstanceOf(LLMProviderUnavailableError);
    expect(dbMock.lLMQuery.delete).toHaveBeenCalledWith({ where: { id: 'q1' } });
  });
});

describe('runLLMQuery moderation outcomes', () => {
  it('moderation unavailable: 503, not flagged, reservation released', async () => {
    vi.mocked(checkSafety).mockResolvedValue({ safe: false, reason: 'unavailable' });
    await expect(runLLMQuery(opts)).rejects.toBeInstanceOf(LLMModerationUnavailableError);
    expect(dbMock.lLMQuery.update).not.toHaveBeenCalled();
    expect(dbMock.lLMQuery.delete).toHaveBeenCalledWith({ where: { id: 'q1' } });
  });

  it('genuinely flagged input is recorded as flagged and keeps the quota row', async () => {
    vi.mocked(checkSafety).mockResolvedValue({ safe: false, reason: 'moderation', categories: { violence: 0.9 } });
    await expect(runLLMQuery(opts)).rejects.toBeInstanceOf(LLMContentBlockedInputError);
    expect(dbMock.lLMQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ inputModerationFlagged: true }) }),
    );
    expect(dbMock.lLMQuery.delete).not.toHaveBeenCalled();
  });
});
