import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkSafety } from './pipeline.js';

vi.mock('./keywords.js', () => ({ checkKeywords: vi.fn() }));
vi.mock('./moderation.js', () => ({ checkModeration: vi.fn() }));

const { checkKeywords } = await import('./keywords.js');
const { checkModeration } = await import('./moderation.js');

beforeEach(() => {
  vi.mocked(checkKeywords).mockReset();
  vi.mocked(checkModeration).mockReset();
});

describe('checkSafety', () => {
  it('passes when keywords AND moderation pass', async () => {
    vi.mocked(checkKeywords).mockReturnValueOnce({ safe: true, matched: [] });
    vi.mocked(checkModeration).mockResolvedValueOnce({ safe: true });
    const result = await checkSafety('Salut', 'input');
    expect(result.safe).toBe(true);
  });

  it('blocks early on keyword match (no moderation call)', async () => {
    vi.mocked(checkKeywords).mockReturnValueOnce({ safe: false, matched: ['omor'] });
    const result = await checkSafety('te omor', 'input');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('keyword');
    expect(result.matched).toEqual(['omor']);
    expect(vi.mocked(checkModeration)).not.toHaveBeenCalled();
  });

  it('blocks when keywords pass but moderation flags', async () => {
    vi.mocked(checkKeywords).mockReturnValueOnce({ safe: true, matched: [] });
    vi.mocked(checkModeration).mockResolvedValueOnce({
      safe: false,
      categories: { 'sexual/minors': 0.2 },
    });
    const result = await checkSafety('subtle bad content', 'input');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('moderation');
    expect(result.categories).toEqual({ 'sexual/minors': 0.2 });
  });

  it('passes direction to moderation', async () => {
    vi.mocked(checkKeywords).mockReturnValueOnce({ safe: true, matched: [] });
    vi.mocked(checkModeration).mockResolvedValueOnce({ safe: true });
    await checkSafety('text', 'output');
    expect(vi.mocked(checkModeration)).toHaveBeenCalledWith('text', 'output');
  });
});
