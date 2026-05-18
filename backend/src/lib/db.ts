import { PrismaClient } from '@prisma/client';
import { env } from '../config/index.js';

const log: ('query' | 'error' | 'warn')[] =
  env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'];

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const db =
  global.__prisma ??
  new PrismaClient({
    log,
  });

if (env.NODE_ENV === 'development') {
  global.__prisma = db;
}

export type DB = typeof db;
