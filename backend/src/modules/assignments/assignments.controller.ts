import type { Request, Response, NextFunction } from 'express';
import * as svc from './assignments.service.js';
import { UnauthorizedError } from '../../lib/errors.js';

function requireTeacher(req: Request) {
  if (!req.auth || req.auth.role !== 'teacher') throw new UnauthorizedError();
  return { teacherId: req.auth.userId, tenantId: req.auth.tenantId };
}
function requireStudent(req: Request) {
  if (!req.auth || req.auth.role !== 'student') throw new UnauthorizedError();
  return { studentId: req.auth.userId, tenantId: req.auth.tenantId };
}

export async function teacherCreate(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireTeacher(req);
    const data = await svc.teacherCreate({
      ...ctx,
      classId: req.params['classId'] as string,
      ...req.body,
    });
    res.status(201).json(data);
  } catch (e) { next(e); }
}

export async function teacherListByClass(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireTeacher(req);
    const data = await svc.teacherListByClass({
      ...ctx,
      classId: req.params['classId'] as string,
    });
    res.json({ data });
  } catch (e) { next(e); }
}

export async function teacherGetDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireTeacher(req);
    const data = await svc.teacherGetDetail({
      ...ctx,
      assignmentId: req.params['id'] as string,
    });
    res.json(data);
  } catch (e) { next(e); }
}

export async function teacherUpdate(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireTeacher(req);
    const data = await svc.teacherUpdate({
      ...ctx,
      assignmentId: req.params['id'] as string,
      ...req.body,
    });
    res.json(data);
  } catch (e) { next(e); }
}

export async function teacherArchive(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireTeacher(req);
    await svc.teacherArchive({
      ...ctx,
      assignmentId: req.params['id'] as string,
    });
    res.status(204).end();
  } catch (e) { next(e); }
}

export async function studentList(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireStudent(req);
    const data = await svc.studentList(ctx);
    res.json({ data });
  } catch (e) { next(e); }
}

export async function studentSubmit(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = requireStudent(req);
    const data = await svc.studentSubmit({
      ...ctx,
      assignmentId: req.params['id'] as string,
      ...req.body,
    });
    res.json(data);
  } catch (e) { next(e); }
}
