import { describe, it, expect } from 'vitest';
import type { Response } from 'express';
import { sendFakedStream } from './sse.js';

function mockResponse() {
  const headers: Record<string, string> = {};
  const writes: string[] = [];
  let ended = false;
  return {
    res: {
      setHeader: (k: string, v: string) => { headers[k] = v; },
      write: (chunk: string) => { writes.push(chunk); return true; },
      end: () => { ended = true; },
      flushHeaders: () => undefined,
    } as unknown as Response,
    headers,
    writes,
    isEnded: () => ended,
  };
}

describe('sendFakedStream', () => {
  it('sets SSE headers', async () => {
    const mock = mockResponse();
    await sendFakedStream(mock.res, 'Salut', { chunkDelayMs: 0, tokens: { in: 10, out: 5 } });
    expect(mock.headers['Content-Type']).toBe('text/event-stream');
    expect(mock.headers['Cache-Control']).toBe('no-cache');
    expect(mock.headers['Connection']).toBe('keep-alive');
  });

  it('emits one chunk per word + final done event', async () => {
    const mock = mockResponse();
    await sendFakedStream(mock.res, 'Salut copil drag', { chunkDelayMs: 0, tokens: { in: 10, out: 5 } });
    const dataLines = mock.writes.filter((w) => w.startsWith('data: '));
    expect(dataLines.length).toBeGreaterThanOrEqual(4);
    const lastEvent = dataLines[dataLines.length - 1];
    expect(lastEvent).toContain('"done":true');
    expect(lastEvent).toContain('"inputTokens":10');
    expect(lastEvent).toContain('"outputTokens":5');
  });

  it('ends response after stream', async () => {
    const mock = mockResponse();
    await sendFakedStream(mock.res, 'Salut', { chunkDelayMs: 0, tokens: { in: 5, out: 2 } });
    expect(mock.isEnded()).toBe(true);
  });

  it('handles empty text gracefully', async () => {
    const mock = mockResponse();
    await sendFakedStream(mock.res, '', { chunkDelayMs: 0, tokens: { in: 0, out: 0 } });
    expect(mock.isEnded()).toBe(true);
  });
});
