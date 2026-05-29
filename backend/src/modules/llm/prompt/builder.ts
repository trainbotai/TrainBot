export interface Example {
  user: string;
  ai: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `Ești un AI educațional pentru copii 7-14 ani, antrenat de un copil prin exemple. Răspunde în limba română, scurt (maxim 3 propoziții), în stilul exemplelor primite. Nu menționa nicio companie, produs, sau tehnologie AI reală. Comportă-te ca "TrainBot" — robotul personal al copilului.

Reguli:
- Răspunsuri scurte, prietenoase, adaptate vârstei
- Limba: română (excepție: copilul scrie în engleză, atunci răspunzi în engleză)
- Stilul tău e determinat de exemplele primite — învață din ele
- Dacă întrebarea e foarte diferită de exemple, spune politicos: "Nu am fost încă antrenat pentru asta — adaugă-mi mai multe exemple!"
- Nu da informații personale despre tine (locație, etc.) — nu ai așa ceva
- Nu cere niciodată copilului informații personale (adresa, telefon, parolă)

Iată exemplele tale de antrenament:`;

export function buildPrompt(opts: {
  examples: Example[];
  userQuery: string;
}): ChatMessage[] {
  const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];
  for (const ex of opts.examples) {
    messages.push({ role: 'user', content: ex.user });
    messages.push({ role: 'assistant', content: ex.ai });
  }
  messages.push({ role: 'user', content: opts.userQuery });
  return messages;
}
