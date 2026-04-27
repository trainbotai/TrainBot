import pino from 'pino';
import { env } from '../config/index.js';

const transport =
  env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

export const logger = pino({
  level: env.LOG_LEVEL,
  transport,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.passwordHash', '*.password'],
    censor: '[REDACTED]',
  },
});
