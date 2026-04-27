import type { Request, Response, NextFunction } from 'express';
import * as svc from './classes.service.js';
import { UnauthorizedError } from '../../lib/errors.js';

function requireTeacher(req: Request) {
  if (!req.auth || req.auth.role !== 'teacher') {
    throw new UnauthorizedError();
  }
  return { teacherId: req.auth.userId, tenantId: req.auth.tenantId };
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireTeacher(req);
    const data = await svc.listClasses(ctx);
    res.json({ data });
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireTeacher(req);
    const klass = await svc.createClass({ ...ctx, ...req.body });
    res.status(201).json(klass);
  } catch (e) {
    next(e);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireTeacher(req);
    const classId = req.params['id'] as string;
    const klass = await svc.getClassById({ classId, ...ctx });
    res.json(klass);
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireTeacher(req);
    const classId = req.params['id'] as string;
    const klass = await svc.updateClass({ classId, ...ctx, ...req.body });
    res.json(klass);
  } catch (e) {
    next(e);
  }
}

export async function archive(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireTeacher(req);
    const classId = req.params['id'] as string;
    await svc.archiveClass({ classId, ...ctx });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
