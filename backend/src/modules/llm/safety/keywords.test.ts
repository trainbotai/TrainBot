import { describe, it, expect } from 'vitest';
import { checkKeywords } from './keywords.js';

describe('checkKeywords', () => {
  it('passes safe Romanian text', () => {
    expect(checkKeywords('Salut robot, cum esti?').safe).toBe(true);
  });

  it('passes safe English text', () => {
    expect(checkKeywords('Hello robot, how are you?').safe).toBe(true);
  });

  it('blocks Romanian violence keyword', () => {
    const result = checkKeywords('Te omor');
    expect(result.safe).toBe(false);
    expect(result.matched).toContain('omor');
  });

  it('blocks English suicide phrase', () => {
    const result = checkKeywords('kill yourself');
    expect(result.safe).toBe(false);
    expect(result.matched).toContain('kill yourself');
  });

  it('case-insensitive matching', () => {
    expect(checkKeywords('TE OMOR').safe).toBe(false);
    expect(checkKeywords('Sex').safe).toBe(false);
  });

  it('blocks PII request', () => {
    expect(checkKeywords('Care e adresa ta?').safe).toBe(false);
  });

  it('handles empty string', () => {
    expect(checkKeywords('').safe).toBe(true);
  });

  it('normalizes Romanian diacritics', () => {
    // "sinucid" without diacritics should match "sinucid" with diacritics
    expect(checkKeywords('vreau sa ma sinucid').safe).toBe(false);
  });

  it('matches Romanian inflections via prefix rules', () => {
    expect(checkKeywords('îl omoară pe robot').safe).toBe(false);
    expect(checkKeywords('pornografie').safe).toBe(false);
  });

  it('does NOT block common Romanian words (false positives istorice)', () => {
    expect(checkKeywords('pornim jocul!').safe).toBe(true);
    expect(checkKeywords('pornește robotul').safe).toBe(true);
    expect(checkKeywords('am pornit antrenamentul').safe).toBe(true);
    expect(checkKeywords('un sextet de muzicieni').safe).toBe(true);
    expect(checkKeywords('citim din Dickens').safe).toBe(true);
    expect(checkKeywords('Cum antrenez robotul să recunoască pisici?').safe).toBe(true);
  });
});
