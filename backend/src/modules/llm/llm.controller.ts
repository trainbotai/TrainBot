import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../lib/errors.js';
import * as service from './llm.service.js';
import { sendFakedStream } from './streaming/sse.js';

function requireStudent(req: Request): { studentId: string; tenantId: string } {
  if (!req.auth || req.auth.role !== 'student') throw new UnauthorizedError();
  return { studentId: req.auth.userId, tenantId: req.auth.tenantId };
}

function requireTeacher(req: Request): { teacherId: string; tenantId: string } {
  if (!req.auth || req.auth.role !== 'teacher') throw new UnauthorizedError();
  return { teacherId: req.auth.userId, tenantId: req.auth.tenantId };
}

export async function createSession(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, tenantId } = requireStudent(req);
    const session = await service.createSession({
      studentId,
      tenantId,
      name: req.body.name,
      assignmentId: req.body.assignmentId,
      examples: req.body.examples,
    });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

export async function listMySessions(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = requireStudent(req);
    const sessions = await service.listMySessions(studentId);
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
}

export async function getMySession(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = requireStudent(req);
    const session = await service.getSessionDetail(req.params['id'] as string, studentId);
    res.json(session);
  } catch (err) {
    next(err);
  }
}

export async function addVersion(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = requireStudent(req);
    const session = await service.addVersion(
      req.params['id'] as string,
      studentId,
      req.body.examples,
    );
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

export async function deleteSession(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = requireStudent(req);
    await service.softDeleteSession(req.params['id'] as string, studentId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function query(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = requireStudent(req);
    const result = await service.executeQuery({
      sessionId: req.params['id'] as string,
      studentId,
      userPrompt: req.body.prompt,
    });
    await sendFakedStream(res, result.response, {
      tokens: { in: result.inputTokens, out: result.outputTokens },
    });
  } catch (err) {
    next(err);
  }
}

export async function listMyQueries(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = requireStudent(req);
    const version = req.query.version
      ? parseInt(req.query.version as string, 10)
      : undefined;
    const queries = await service.listQueries(req.params['id'] as string, studentId, version);
    res.json({ queries });
  } catch (err) {
    next(err);
  }
}

export async function report(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = requireStudent(req);
    const result = await service.reportSession({
      sessionId: req.params['id'] as string,
      studentId,
      reason: req.body.reason,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getQuota(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = requireStudent(req);
    const quota = await service.getQuota(studentId);
    res.json(quota);
  } catch (err) {
    next(err);
  }
}

export async function teacherAssignmentSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId } = requireTeacher(req);
    const sessions = await service.teacherGetAssignmentSessions({
      teacherId,
      assignmentId: req.params['id'] as string,
    });
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
}

export async function teacherSessionDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId } = requireTeacher(req);
    const version = req.query.version
      ? parseInt(req.query.version as string, 10)
      : undefined;
    const detail = await service.teacherGetSessionDetail({
      teacherId,
      sessionId: req.params['id'] as string,
      version,
    });
    res.json(detail);
  } catch (err) {
    next(err);
  }
}

export async function teacherReports(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId } = requireTeacher(req);
    const reports = await service.listReports(teacherId);
    res.json({ reports });
  } catch (err) {
    next(err);
  }
}

export async function teacherMarkReportReviewed(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId } = requireTeacher(req);
    await service.markReportReviewed({
      teacherId,
      reportId: req.params['id'] as string,
      reviewed: req.body.reviewed,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
