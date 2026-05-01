import type { Request, Response, NextFunction } from 'express';
import * as svc from './ml.service.js';
import { UnauthorizedError } from '../../lib/errors.js';

function requireStudent(req: Request) {
  if (!req.auth || req.auth.role !== 'student') throw new UnauthorizedError();
  return { studentId: req.auth.userId, tenantId: req.auth.tenantId };
}

function requireTeacher(req: Request) {
  if (!req.auth || req.auth.role !== 'teacher') throw new UnauthorizedError();
  return { teacherId: req.auth.userId, tenantId: req.auth.tenantId };
}

// Student endpoints
export async function listOwnProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireStudent(req);
    const data = await svc.listOwnProjects(ctx);
    res.json({ data });
  } catch (e) { next(e); }
}

export async function syncProject(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireStudent(req);
    const project = await svc.syncProject({ ...ctx, body: req.body });
    res.status(200).json(project);
  } catch (e) { next(e); }
}

export async function deleteOwnProject(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireStudent(req);
    await svc.deleteOwnProject({ studentId: ctx.studentId, projectId: req.params['id'] as string });
    res.status(204).end();
  } catch (e) { next(e); }
}

// Teacher endpoints
export async function teacherListStudentProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireTeacher(req);
    const data = await svc.teacherListStudentProjects({
      ...ctx,
      studentId: req.params['studentId'] as string,
    });
    res.json({ data });
  } catch (e) { next(e); }
}

export async function teacherListClassProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireTeacher(req);
    const data = await svc.teacherListClassProjects({
      ...ctx,
      classId: req.params['classId'] as string,
    });
    res.json({ data });
  } catch (e) { next(e); }
}
