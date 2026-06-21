import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../../lib/errors.js';
import * as service from './teacherBots.service.js';
import { sendFakedStream } from '../streaming/sse.js';

function requireTeacher(req: Request): { teacherId: string; tenantId: string } {
  if (!req.auth || req.auth.role !== 'teacher') throw new UnauthorizedError();
  return { teacherId: req.auth.userId, tenantId: req.auth.tenantId };
}

function requireStudent(req: Request): { studentId: string; tenantId: string } {
  if (!req.auth || req.auth.role !== 'student') throw new UnauthorizedError();
  return { studentId: req.auth.userId, tenantId: req.auth.tenantId };
}

// ----- Teacher handlers -----

export async function createBot(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId, tenantId } = requireTeacher(req);
    const bot = await service.createBot({
      teacherId,
      tenantId,
      name: req.body.name,
      instruction: req.body.instruction,
      examples: req.body.examples,
      classId: req.body.classId,
    });
    res.status(201).json(bot);
  } catch (err) {
    next(err);
  }
}

export async function listBots(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId } = requireTeacher(req);
    const bots = await service.listBots({ teacherId });
    res.json({ bots });
  } catch (err) {
    next(err);
  }
}

export async function getBot(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId } = requireTeacher(req);
    const bot = await service.getBot({ teacherId, botId: req.params['id'] as string });
    res.json(bot);
  } catch (err) {
    next(err);
  }
}

export async function updateBot(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId, tenantId } = requireTeacher(req);
    const bot = await service.updateBot({
      teacherId,
      tenantId,
      botId: req.params['id'] as string,
      name: req.body.name,
      instruction: req.body.instruction,
      examples: req.body.examples,
      classId: req.body.classId,
    });
    res.json(bot);
  } catch (err) {
    next(err);
  }
}

export async function deleteBot(req: Request, res: Response, next: NextFunction) {
  try {
    const { teacherId } = requireTeacher(req);
    await service.deleteBot({ teacherId, botId: req.params['id'] as string });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// ----- Student handlers -----

export async function listBotsForStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, tenantId } = requireStudent(req);
    const bots = await service.listBotsForStudent({ studentId, tenantId });
    res.json({ bots });
  } catch (err) {
    next(err);
  }
}

export async function queryBot(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, tenantId } = requireStudent(req);
    const result = await service.queryBotAsStudent({
      studentId,
      tenantId,
      botId: req.params['id'] as string,
      userPrompt: req.body.prompt,
    });
    await sendFakedStream(res, result.response, {
      tokens: { in: result.inputTokens, out: result.outputTokens },
    });
  } catch (err) {
    next(err);
  }
}
