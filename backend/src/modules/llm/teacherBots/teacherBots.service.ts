import { db } from '../../../lib/db.js';
import { ForbiddenError, NotFoundError, LLMTeacherBotNotFoundError } from '../../../lib/errors.js';
import { runLLMQuery, type RunQueryResult } from '../llm.queryRunner.js';
import type { Example } from '../llm.types.js';

export interface BotExample {
  input: string;
  output: string;
}

export interface BotSummary {
  id: string;
  name: string;
  classId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BotDetail extends BotSummary {
  instruction: string;
  examples: BotExample[];
}

function rowToDetail(row: {
  id: string;
  name: string;
  instruction: string;
  examples: unknown;
  classId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): BotDetail {
  return {
    id: row.id,
    name: row.name,
    instruction: row.instruction,
    examples: row.examples as BotExample[],
    classId: row.classId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createBot(opts: {
  teacherId: string;
  tenantId: string;
  name: string;
  instruction: string;
  examples: BotExample[];
  classId?: string;
}): Promise<BotDetail> {
  if (opts.classId) {
    const cls = await db.class.findFirst({
      where: { id: opts.classId, teacherId: opts.teacherId },
    });
    if (!cls) throw new ForbiddenError('Class does not belong to you');
  }

  const bot = await db.lLMTeacherBot.create({
    data: {
      tenantId: opts.tenantId,
      teacherId: opts.teacherId,
      classId: opts.classId ?? null,
      name: opts.name,
      instruction: opts.instruction,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      examples: opts.examples as any,
    },
  });

  return rowToDetail(bot);
}

export async function listBots(opts: {
  teacherId: string;
}): Promise<BotSummary[]> {
  const bots = await db.lLMTeacherBot.findMany({
    where: { teacherId: opts.teacherId },
    orderBy: { createdAt: 'desc' },
  });

  return bots.map((b) => ({
    id: b.id,
    name: b.name,
    classId: b.classId,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));
}

export async function getBot(opts: {
  teacherId: string;
  botId: string;
}): Promise<BotDetail> {
  const bot = await db.lLMTeacherBot.findFirst({
    where: { id: opts.botId, teacherId: opts.teacherId },
  });
  if (!bot) throw new LLMTeacherBotNotFoundError();
  return rowToDetail(bot);
}

export async function updateBot(opts: {
  teacherId: string;
  tenantId: string;
  botId: string;
  name?: string;
  instruction?: string;
  examples?: BotExample[];
  classId?: string | null;
}): Promise<BotDetail> {
  const bot = await db.lLMTeacherBot.findFirst({
    where: { id: opts.botId, teacherId: opts.teacherId },
  });
  if (!bot) throw new LLMTeacherBotNotFoundError();

  if (opts.classId !== undefined && opts.classId !== null) {
    const cls = await db.class.findFirst({
      where: { id: opts.classId, teacherId: opts.teacherId },
    });
    if (!cls) throw new ForbiddenError('Class does not belong to you');
  }

  const updated = await db.lLMTeacherBot.update({
    where: { id: opts.botId },
    data: {
      ...(opts.name !== undefined && { name: opts.name }),
      ...(opts.instruction !== undefined && { instruction: opts.instruction }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(opts.examples !== undefined && { examples: opts.examples as any }),
      ...(opts.classId !== undefined && { classId: opts.classId }),
    },
  });

  return rowToDetail(updated);
}

export async function deleteBot(opts: {
  teacherId: string;
  botId: string;
}): Promise<void> {
  const bot = await db.lLMTeacherBot.findFirst({
    where: { id: opts.botId, teacherId: opts.teacherId },
  });
  if (!bot) throw new LLMTeacherBotNotFoundError();

  await db.lLMTeacherBot.delete({ where: { id: opts.botId } });
}

// ----- Student-facing -----

export interface StudentBotSummary {
  id: string;
  name: string;
  teacherName: string;
}

export async function listBotsForStudent(opts: {
  studentId: string;
  tenantId: string;
}): Promise<StudentBotSummary[]> {
  const student = await db.student.findUnique({
    where: { id: opts.studentId },
    select: { classId: true },
  });
  if (!student) throw new ForbiddenError('Student not found');

  const bots = await db.lLMTeacherBot.findMany({
    where: {
      tenantId: opts.tenantId,
      OR: [{ classId: null }, { classId: student.classId }],
    },
    include: { teacher: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return bots.map((b) => ({
    id: b.id,
    name: b.name,
    teacherName: b.teacher.name,
  }));
}

export async function queryBotAsStudent(opts: {
  studentId: string;
  tenantId: string;
  botId: string;
  userPrompt: string;
}): Promise<RunQueryResult> {
  const student = await db.student.findUnique({
    where: { id: opts.studentId },
    select: { classId: true },
  });
  if (!student) throw new ForbiddenError('Student not found');

  const bot = await db.lLMTeacherBot.findFirst({
    where: {
      id: opts.botId,
      tenantId: opts.tenantId,
      OR: [{ classId: null }, { classId: student.classId }],
    },
  });
  if (!bot) throw new LLMTeacherBotNotFoundError();

  // Convert bot examples to Example[] format used by buildPrompt
  const examples: Example[] = (bot.examples as unknown as BotExample[]).map((e) => ({
    user: e.input,
    ai: e.output,
  }));

  return runLLMQuery({
    studentId: opts.studentId,
    userPrompt: opts.userPrompt,
    examples,
    auditContext: { type: 'bot', botId: opts.botId },
  });
}
