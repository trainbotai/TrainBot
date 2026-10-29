import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { env } from '../config/index.js';
import { verifyAccessTokenIgnoringExpiry } from '../services/tokenService.js';

const skipInTests = () => env.NODE_ENV === 'test';

// O clasă întreagă (30 elevi) stă în spatele NAT-ului școlii = un singur IP.
// Limitele per-IP blochează sistematic clasa, deci cheia e utilizatorul:
// `sub` din access token-ul cu semnătura VERIFICATĂ (expirarea ignorată: un token expirat
// e tot al elevului). Token lipsă/forjat → per-IP, altfel s-ar putea ocoli limita
// sau epuiza bucket-ul altcuiva.
export function userOrIpKey(req: Request): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessTokenIgnoringExpiry(auth.slice(7));
      if (payload.sub) return `u:${payload.sub}`;
    } catch {
      // token forjat/malformat → fallback IP
    }
  }
  return `ip:${req.ip ?? ''}`;
}

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  // /auth are limitele lui (authLimiter, refreshLimiter); aici ar cădea per-IP și 30 de
  // login-uri dintr-un NAT de școală ar umple singure bucket-ul comun.
  skip: (req: Request) => skipInTests() || req.originalUrl.startsWith('/api/v1/auth/'),
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

// Refresh/logout nu poartă username/email; cheia e IP-ul, deci plafonul e mai generos
// (clasa dintr-un NAT reîmprospătează token-urile aproape simultan).
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  keyGenerator: (req: Request) => `refresh:${req.ip ?? ''}`,
  message: {
    type: 'https://trainbot.ro/errors/too_many_requests',
    title: 'Too many requests',
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
