import OpenAI from 'openai';
import { env } from '../../../config/index.js';
import { logger } from '../../../lib/logger.js';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export const INPUT_THRESHOLDS: Record<string, number> = {
  sexual: 0.5, 'sexual/minors': 0.1,
  harassment: 0.7, 'harassment/threatening': 0.5,
  hate: 0.6, 'hate/threatening': 0.3,
  'self-harm': 0.5, 'self-harm/intent': 0.3, 'self-harm/instructions': 0.2,
  violence: 0.7, 'violence/graphic': 0.5,
  illicit: 0.7, 'illicit/violent': 0.5,
};

export const OUTPUT_THRESHOLDS: Record<string, number> = {
  sexual: 0.3, 'sexual/minors': 0.05,
  harassment: 0.5, 'harassment/threatening': 0.3,
  hate: 0.4, 'hate/threatening': 0.2,
  'self-harm': 0.3, 'self-harm/intent': 0.2, 'self-harm/instructions': 0.1,
  violence: 0.5, 'violence/graphic': 0.3,
  illicit: 0.5, 'illicit/violent': 0.3,
};

export interface ModerationResult {
  safe: boolean;
  categories?: Record<string, number>;
  error?: boolean;
}

export async function checkModeration(
  text: string,
  direction: 'input' | 'output',
): Promise<ModerationResult> {
  const thresholds = direction === 'input' ? INPUT_THRESHOLDS : OUTPUT_THRESHOLDS;
  try {
    const response = await client.moderations.create({
      model: 'omni-moderation-latest',
      input: text,
    });
    const result = response.results[0];
    if (!result) {
      logger.error('OpenAI Moderation returned empty results array');
      return { safe: false, error: true };
    }
    const flaggedCategories: Record<string, number> = {};
    for (const [category, threshold] of Object.entries(thresholds)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const score = (result.category_scores as any)[category];
      if (typeof score === 'number' && score >= threshold) {
        flaggedCategories[category] = score;
      }
    }
    if (Object.keys(flaggedCategories).length > 0) {
      return { safe: false, categories: flaggedCategories };
    }
    return { safe: true };
  } catch (err) {
    logger.error({ err }, 'OpenAI Moderation API failed — fail-safe block');
    return { safe: false, error: true };
  }
}
