import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMExamplesInvalidError, LLMModerationUnavailableError } from '../../../lib/errors.js';

vi.mock('./pipeline.js', () => ({ checkSafety: vi.fn() }));

const { checkSafety } = await import('./pipeline.js');
const { assertSafeForStorage } = await import('./assertSafe.js');

beforeEach(() => vi.mocked(checkSafety).mockReset());

describe('assertSafeForStorage', () => {
  it('passes when every item is safe and uses the item direction', async () => {
    vi.mocked(checkSafety).mockResolvedValue({ safe: true });
    await expect(
      assertSafeForStorage([
        { text: 'q', direction: 'input' },
        { text: 'a', direction: 'output' },
      ]),
    ).resolves.toBeUndefined();
    expect(checkSafety).toHaveBeenCalledWith('q', 'input');
    expect(checkSafety).toHaveBeenCalledWith('a', 'output');
  });

  it('rejects with LLMExamplesInvalidError when any item is unsafe', async () => {
    vi.mocked(checkSafety)
      .mockResolvedValueOnce({ safe: true })
      .mockResolvedValueOnce({ safe: false, reason: 'keyword', matched: ['x'] });
    await expect(
      assertSafeForStorage([
        { text: 'ok', direction: 'input' },
        { text: 'bad', direction: 'output' },
      ]),
    ).rejects.toBeInstanceOf(LLMExamplesInvalidError);
  });

  it('fails closed with 503 when moderation is unavailable', async () => {
    vi.mocked(checkSafety).mockResolvedValue({ safe: false, reason: 'unavailable' });
    await expect(
      assertSafeForStorage([{ text: 'x', direction: 'input' }]),
    ).rejects.toBeInstanceOf(LLMModerationUnavailableError);
  });
});
