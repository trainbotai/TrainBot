import rateLimit from 'express-rate-limit';
import { env } from '../config/index.js';

const skipInTests = () => env.NODE_ENV === 'test';

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: {
    type: 'https://trainbot.ro/errors/too_many_requests',
    title: 'Too many requests',
    status: 429,
    detail: 'You have exceeded the rate limit. Please slow down.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
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
