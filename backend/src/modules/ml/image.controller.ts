import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as svc from './image.service.js';
import { env } from '../../config/index.js';
import { UnauthorizedError, BadRequestError } from '../../lib/errors.js';

// Multer in-memory storage — sharp pipeline reads buffer directly
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_BYTES, files: 1 },
});

export const imageUploadMiddleware = upload.single('image');

function requireStudent(req: Request) {
  if (!req.auth || req.auth.role !== 'student') throw new UnauthorizedError();
  return { studentId: req.auth.userId, tenantId: req.auth.tenantId };
}

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireStudent(req);
    if (!req.file) throw new BadRequestError('image file required (field "image")');
    const clientId = (req.body?.clientId as string | undefined)?.trim();
    if (!clientId) throw new BadRequestError('clientId field required');

    const projectId = req.params['projectId'] as string;
    const labelId = req.params['labelId'] as string;

    const created = await svc.uploadImage({
      studentId: ctx.studentId,
      projectId,
      labelId,
      clientId,
      buffer: req.file.buffer,
    });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
}

export async function deleteImage(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireStudent(req);
    await svc.deleteImageById({ studentId: ctx.studentId, imageId: req.params['imageId'] as string });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

// Auth-checked image serving (works for student owner OR teacher of student's class)
export async function serveImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw new UnauthorizedError();
    const { absolutePath, sizeBytes } = await svc.resolveImageForServing({
      imageId: req.params['imageId'] as string,
      requesterId: req.auth.userId,
      requesterRole: req.auth.role,
      tenantId: req.auth.tenantId,
    });
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', sizeBytes.toString());
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.sendFile(absolutePath);
  } catch (e) {
    next(e);
  }
}
