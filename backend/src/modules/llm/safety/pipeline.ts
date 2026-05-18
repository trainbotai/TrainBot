import { checkKeywords } from './keywords.js';
import { checkModeration } from './moderation.js';

export interface SafetyResult {
  safe: boolean;
  reason?: 'keyword' | 'moderation';
  matched?: string[];
  categories?: Record<string, number>;
}

export async function checkSafety(
  text: string,
  direction: 'input' | 'output',
): Promise<SafetyResult> {
  const kw = checkKeywords(text);
  if (!kw.safe) {
    return { safe: false, reason: 'keyword', matched: kw.matched };
  }
  const mod = await checkModeration(text, direction);
  if (!mod.safe) {
    return { safe: false, reason: 'moderation', categories: mod.categories };
  }
  return { safe: true };
}
