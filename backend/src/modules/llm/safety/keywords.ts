const BLOCKED_KEYWORDS_RO = [
  // Violenta fizica
  'omor', 'te omor', 'sa te omor', 'sinucid', 'sinucide', 'sa ma sinucid',
  'spanzur', 'spanzura', 'amputez', 'amputeaza',
  // Sex (explicit, age-inappropriate)
  'sex', 'porno', 'porn', 'curva', 'pizda', 'fute', 'fut',
  // Info personala (PII solicitations)
  'unde locuiesti', 'unde stai', 'adresa ta', 'adresa de acasa',
  'numarul de telefon', 'nr de telefon', 'telefonul tau',
  'parola', 'parolele',
];

const BLOCKED_KEYWORDS_EN = [
  'kill yourself', 'kys', 'suicide', 'hang yourself', 'hang myself',
  'sex', 'porn', 'fuck', 'dick', 'pussy',
];

const ALL_KEYWORDS = [...BLOCKED_KEYWORDS_RO, ...BLOCKED_KEYWORDS_EN];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // strip combining diacritics
}

export interface KeywordCheckResult {
  safe: boolean;
  matched: string[];
}

export function checkKeywords(text: string): KeywordCheckResult {
  const normalized = normalize(text);
  const matched: string[] = [];

  for (const keyword of ALL_KEYWORDS) {
    if (normalized.includes(normalize(keyword))) {
      matched.push(keyword);
    }
  }

  return { safe: matched.length === 0, matched };
}
