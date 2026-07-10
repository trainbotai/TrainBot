import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/index.js';
import { db } from './lib/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter, authLimiter, pilotLimiter } from './middleware/rateLimit.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { classesRouter } from './modules/classes/classes.routes.js';
import { classStudentsRouter, studentsRouter } from './modules/students/students.routes.js';
import { studentMlRouter, teacherMlRouter, sharedMlRouter } from './modules/ml/ml.routes.js';
import { teacherAssignmentsRouter, studentAssignmentsRouter } from './modules/assignments/assignments.routes.js';
import { studentLlmRouter, teacherLlmRouter } from './modules/llm/llm.routes.js';
import { teacherBotsRouter, studentBotsRouter } from './modules/llm/teacherBots/teacherBots.routes.js';
import { pilotRouter } from './modules/pilot/pilot.routes.js';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  app.get('/health', async (_req, res) => {
    try {
      await db.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    } catch {
      // Container „up" dar Postgres picat = 503, ca monitorizarea să prindă asta.
      res.status(503).json({ status: 'degraded', db: 'unavailable', timestamp: new Date().toISOString() });
    }
  });

  app.get('/api/v1', (_req, res) => {
    res.json({ name: 'TrainBot API', version: '0.1.0' });
  });

  app.use('/api/', generalLimiter);

  app.use('/api/v1/auth', authLimiter, authRouter);
  app.use('/api/v1/teacher/classes', classesRouter);
  app.use('/api/v1/teacher/classes/:classId/students', classStudentsRouter);
  app.use('/api/v1/teacher/students', studentsRouter);
  app.use('/api/v1/student/ml', studentMlRouter);
  app.use('/api/v1/teacher', teacherMlRouter);
  app.use('/api/v1/ml', sharedMlRouter);
  app.use('/api/v1/teacher', teacherAssignmentsRouter);
  app.use('/api/v1/student', studentAssignmentsRouter);
  app.use('/api/v1/student/llm', studentLlmRouter);
  app.use('/api/v1/teacher/llm', teacherLlmRouter);
  app.use('/api/v1/teacher/llm/bots', teacherBotsRouter);
  app.use('/api/v1/student/llm', studentBotsRouter);
  // Public (fără auth): lead-uri din formularul de pilot de pe site-ul de marketing.
  // Necesită originea site-ului în CORS_ORIGINS (https://trainbot.moldluca.tech).
  app.use('/api/v1/pilot-request', pilotLimiter, pilotRouter);

  // 404 fallback
  app.use((req, res) => {
    res.status(404).json({
      type: 'https://trainbot.ro/errors/not_found',
      title: 'Not found',
      status: 404,
      detail: `Route ${req.method} ${req.originalUrl} not found`,
      instance: req.originalUrl,
    });
  });

  app.use(errorHandler);

  return app;
}
