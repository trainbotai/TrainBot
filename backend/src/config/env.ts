import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),

  UPLOAD_DIR: z.string().default('/var/uploads/trainbot'),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  UPLOAD_MAX_DIMENSION: z.coerce.number().int().positive().default(1024),

  // Email notifications (optional — if RESEND_API_KEY is missing, emails are logged not sent)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('TrainBot <onboarding@resend.dev>'),
  PUBLIC_WEB_URL: z.string().default('https://trainbot.perpetuummobile.tech'),

  // LLM Module (Phase 3A)
  GROQ_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),  // for Moderation API only (free)
  LLM_PROVIDER: z.enum(['groq', 'anthropic']).default('groq'),
  LLM_MODEL: z.string().default('llama-3.3-70b-versatile'),
  LLM_MAX_QUERIES_PER_DAY: z.coerce.number().int().positive().default(50),
  LLM_MAX_EXAMPLES_PER_VERSION: z.coerce.number().int().positive().max(20).default(10),
  LLM_MAX_EXAMPLE_LENGTH: z.coerce.number().int().positive().default(500),
  LLM_GROQ_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  LLM_RETENTION_DAYS: z.coerce.number().int().positive().default(90),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
