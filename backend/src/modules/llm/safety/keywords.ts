// Filtru de cuvinte-cheie (Safety A). Potrivire pe cuvinte întregi (\b...\b),
// NU substring — 'porn' ca substring bloca „pornim/pornește", 'sex' bloca „sextet".
// `prefix: true` = potrivește orice cuvânt care ÎNCEPE cu rădăcina (acoperă
// flexiunile RO: omor → omori/omoară/omorât) — folosit doar unde nu există
// cuvinte inocente cu același început.

interface Keyword {
  kw: string;
  prefix?: boolean;
}

const BLOCKED_KEYWORDS_RO: Keyword[] = [
  // Violenta fizica
  { kw: 'omor', prefix: true },
  { kw: 'omoar', prefix: true }, // omoară, omoare (rădăcina flexionată e 'omoar')
  { kw: 'te omor' },
  { kw: 'sa te omor' },
  { kw: 'sinucid', prefix: true },
  { kw: 'sa ma sinucid' },
  { kw: 'spanzur', prefix: true },
  { kw: 'amputez' },
  { kw: 'amputeaza' },
  // Sex (explicit, age-inappropriate)
  { kw: 'sex' },
  { kw: 'sexual', prefix: true },
  { kw: 'porno', prefix: true }, // pornografie DA, „pornim/pornește" NU (nu încep cu 'porno')
  { kw: 'curva', prefix: true },
  { kw: 'pizda', prefix: true },
  { kw: 'fute', prefix: true },
  { kw: 'fut' },
  { kw: 'futut', prefix: true },
  // Info personala (PII solicitations)
  { kw: 'unde locuiesti' },
  { kw: 'unde stai' },
  { kw: 'adresa ta' },
  { kw: 'adresa de acasa' },
  { kw: 'numarul de telefon' },
  { kw: 'nr de telefon' },
  { kw: 'telefonul tau' },
  { kw: 'parola' },
  { kw: 'parolele' },
];

const BLOCKED_KEYWORDS_EN: Keyword[] = [
  { kw: 'kill yourself' },
  { kw: 'kys' },
  { kw: 'suicid', prefix: true }, // suicide, suicidal
  { kw: 'hang yourself' },
  { kw: 'hang myself' },
  { kw: 'sex' },
  { kw: 'porn' }, // NU prefix — „pornim/pornește"; formele lungi le prinde 'porno' prefix din RO
  { kw: 'fuck', prefix: true },
  { kw: 'dick' },
  { kw: 'pussy' },
];

const ALL_KEYWORDS = [...BLOCKED_KEYWORDS_RO, ...BLOCKED_KEYWORDS_EN];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // strip combining diacritics
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const PATTERNS: { kw: string; re: RegExp }[] = ALL_KEYWORDS.map(({ kw, prefix }) => ({
  kw,
  re: new RegExp(`\\b${escapeRegex(normalize(kw))}${prefix ? '' : '\\b'}`),
}));

export interface KeywordCheckResult {
  safe: boolean;
  matched: string[];
}

export function checkKeywords(text: string): KeywordCheckResult {
  const normalized = normalize(text);
  const matched: string[] = [];

  for (const { kw, re } of PATTERNS) {
    if (re.test(normalized)) {
      matched.push(kw);
    }
  }

  return { safe: matched.length === 0, matched };
}
