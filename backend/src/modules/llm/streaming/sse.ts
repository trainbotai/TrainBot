import type { Response } from 'express';

export interface FakedStreamOptions {
  chunkDelayMs?: number;
  tokens: { in: number; out: number };
}

function escapeJson(text: string): string {
  return JSON.stringify(text);
}

export async function sendFakedStream(
  res: Response,
  fullText: string,
  opts: FakedStreamOptions,
): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let closed = false;
  res.on('close', () => {
    closed = true;
  });

  const delayMs = opts.chunkDelayMs ?? 50;
  const words = fullText.split(/(\s+)/);

  for (const word of words) {
    if (closed) return;
    if (!word) continue;
    res.write(`data: {"chunk":${escapeJson(word)}}\n\n`);
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  if (closed) return;
  res.write(`data: {"done":true,"inputTokens":${opts.tokens.in},"outputTokens":${opts.tokens.out}}\n\n`);
  res.end();
}
