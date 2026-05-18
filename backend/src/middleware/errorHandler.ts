import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
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

  logger.error({ err, url: req.originalUrl, method: req.method }, 'Unhandled error');
  res.status(500).json({
    type: 'https://trainbot.ro/errors/internal_server_error',
    title: 'Internal server error',
    status: 500,
    instance: req.originalUrl,
  });
};
