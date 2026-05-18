import { describe, it, expect } from 'vitest';
import { buildPrompt } from './builder.js';

describe('buildPrompt', () => {
  const examples = [
    { user: 'Ce mai faci?', ai: 'Sunt foarte bine!' },
    { user: 'Cum te cheamă?', ai: 'TrainBot, prietenul tău.' },
  ];

  it('builds messages array with system + few-shot pairs + user query', () => {
    const messages = buildPrompt({ examples, userQuery: 'Salut!' });
    expect(messages).toHaveLength(1 + examples.length * 2 + 1);
    expect(messages[0].role).toBe('system');
    expect(messages[1]).toEqual({ role: 'user', content: 'Ce mai faci?' });
    expect(messages[2]).toEqual({ role: 'assistant', content: 'Sunt foarte bine!' });
    expect(messages[5]).toEqual({ role: 'user', content: 'Salut!' });
  });

  it('system prompt includes safety + persona instructions', () => {
    const messages = buildPrompt({ examples: [], userQuery: 'Hi' });
    const system = messages[0].content;
    expect(system).toContain('TrainBot');
    expect(system).toContain('copii');
    expect(system).toMatch(/română|Romanian/i);
    expect(system).not.toContain('Claude');
    expect(system).not.toContain('Anthropic');
    expect(system).not.toContain('GPT');
    expect(system).not.toContain('Groq');
    expect(system).not.toContain('Llama');
  });

  it('handles empty examples', () => {
    const messages = buildPrompt({ examples: [], userQuery: 'Salut' });
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1]).toEqual({ role: 'user', content: 'Salut' });
  });
});
