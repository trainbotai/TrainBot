import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { env } from '../config/index.js';

const skipInTests = () => env.NODE_ENV === 'test';

// O clasă întreagă (30 elevi) stă în spatele NAT-ului școlii = un singur IP.
// Limitele per-IP blochează sistematic clasa, deci cheia e utilizatorul:
// `sub` din payload-ul JWT (decodat FĂRĂ verificare — suficient pentru bucketing;
// token-urile forjate pică oricum cu 401, iar fallback-ul rămâne per-IP).
function userOrIpKey(req: Request): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      const payloadB64 = auth.slice(7).split('.')[1] ?? '';
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as {
        sub?: string;
      };
      if (payload.sub) return `u:${payload.sub}`;
    } catch {
      // token malformat → fallback IP
    }
  }
  return `ip:${req.ip ?? ''}`;
}

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  keyGenerator: userOrIpKey,
  message: {
    type: 'https://trainbot.ro/errors/too_many_requests',
    title: 'Too many requests',
    status: 429,
    detail: 'You have exceeded the rate limit. Please slow down.',
  },
});

// La login nu există token → cheia e IP + identitatea încercată, altfel
// 10 încercări/15min per IP epuizează clasa la începutul orei.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  keyGenerator: (req: Request) => {
    const body = req.body as { username?: string; email?: string } | undefined;
    const who = body?.username ?? body?.email ?? '';
    return `${req.ip ?? ''}:${who}`;
  },
  message: {
    type: 'https://trainbot.ro/errors/too_many_requests',
    title: 'Too many login attempts',
    status: 429,
    detail: 'Try again in a few minutes.',
  },
});

// Endpoint public de lead-uri (formularul de pilot) — strict, e singura rută fără auth
export const pilotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: {
    type: 'https://trainbot.ro/errors/too_many_requests',
    title: 'Too many requests',
    status: 429,
    detail: 'Try again in an hour, or email us directly.',
  },
});
