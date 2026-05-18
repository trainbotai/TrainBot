import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter, authLimiter } from './middleware/rateLimit.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { classesRouter } from './modules/classes/classes.routes.js';
import { classStudentsRouter, studentsRouter } from './modules/students/students.routes.js';
import { studentMlRouter, teacherMlRouter, sharedMlRouter } from './modules/ml/ml.routes.js';

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

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
