import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      type: `https://trainbot.ro/errors/${err.code}`,
      title: err.title,
      status: err.status,
      detail: err.detail,
      instance: req.originalUrl,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      type: 'https://trainbot.ro/errors/validation_error',
      title: 'Validation failed',
      status: 400,
      detail: 'One or more fields failed validation',
      instance: req.originalUrl,
      fields: err.flatten().fieldErrors,
    });
    return;
  }

  // Upload prea mare / prea multe fișiere → 413, nu 500 cu log de eroare fals.
  if (err instanceof MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    res.status(tooLarge ? 413 : 400).json({
      type: `https://trainbot.ro/errors/${tooLarge ? 'payload_too_large' : 'bad_upload'}`,
      title: tooLarge ? 'File too large' : 'Invalid upload',
      status: tooLarge ? 413 : 400,
      detail: err.message,
      instance: req.originalUrl,
    });
    return;
  }

  // Coliziune pe constrângere unică (cod clasă / email / versiune concurentă) → 409.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({
      type: 'https://trainbot.ro/errors/conflict',
      title: 'Conflict',
      status: 409,
      detail: 'A record with the same unique value already exists.',
      instance: req.originalUrl,
    });
    return;
  }

  logger.error({ err, url: req.originalUrl, method: req.method }, 'Unhandled error');
  res.status(500).json({
    type: 'https://trainbot.ro/errors/internal_server_error',
    title: 'Internal server error',
    status: 500,
    instance: req.originalUrl,
  });
};
