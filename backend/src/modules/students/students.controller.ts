import type { Request, Response, NextFunction } from 'express';
import * as svc from './students.service.js';
import { UnauthorizedError } from '../../lib/errors.js';

function ctxFromReq(req: Request) {
  if (!req.auth || req.auth.role !== 'teacher') throw new UnauthorizedError();
  return { teacherId: req.auth.userId, tenantId: req.auth.tenantId };
}

export async function createOne(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = ctxFromReq(req);
    const classId = req.params['classId'] as string;
    const student = await svc.createStudent({ classId, ...ctx, ...req.body });
    res.status(201).json(student);
  } catch (e) {
    next(e);
  }
}

export async function createBulk(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = ctxFromReq(req);
    const classId = req.params['classId'] as string;
    const result = await svc.bulkCreateStudents({
      classId,
      ...ctx,
      students: req.body.students,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = ctxFromReq(req);
    const id = req.params['id'] as string;
    await svc.resetStudentPassword({ studentId: id, ...ctx, ...req.body });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

export async function deleteOne(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = ctxFromReq(req);
    const id = req.params['id'] as string;
    await svc.deleteStudent({ studentId: id, ...ctx });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
