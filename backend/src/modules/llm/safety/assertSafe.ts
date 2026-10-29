import { LLMExamplesInvalidError, LLMModerationUnavailableError } from '../../../lib/errors.js';
import { checkSafety } from './pipeline.js';

export interface SafetyItem {
  text: string;
  direction: 'input' | 'output';
}

/**
 * Verifică la scriere textele stocate (exemple few-shot, instrucțiuni de bot) cu același
 * pipeline ca prompt-ul/răspunsul din runtime — altfel se pot injecta conținut nepotrivit
 * în prompt ocolind verificarea. Fail-closed: moderare indisponibilă = 503, nu salvare.
 */
export async function assertSafeForStorage(items: SafetyItem[]): Promise<void> {
  const results = await Promise.all(items.map((i) => checkSafety(i.text, i.direction)));
  if (results.some((r) => r.reason === 'unavailable')) {
    throw new LLMModerationUnavailableError();
  }
  if (results.some((r) => !r.safe)) {
    throw new LLMExamplesInvalidError(
      'Conținutul conține cuvinte sau idei nepotrivite. Reformulează.',
    );
  }
}
