import { db } from '../../lib/db.js';
import {
  LLMSessionNotFoundError,
  LLMExamplesInvalidError,
  ForbiddenError,
} from '../../lib/errors.js';
import { env } from '../../config/index.js';
import type { Example, SessionSummary, SessionDetail, ChatHistoryItem } from './llm.types.js';

function validateExamples(examples: Example[]): void {
  if (examples.length > env.LLM_MAX_EXAMPLES_PER_VERSION) {
    throw new LLMExamplesInvalidError(
      `Maxim ${env.LLM_MAX_EXAMPLES_PER_VERSION} perechi de exemple.`,
    );
  }
  for (const ex of examples) {
    if (
      !ex.user ||
      !ex.ai ||
      ex.user.length > env.LLM_MAX_EXAMPLE_LENGTH ||
      ex.ai.length > env.LLM_MAX_EXAMPLE_LENGTH
    ) {
      throw new LLMExamplesInvalidError(
        `Fiecare exemplu max ${env.LLM_MAX_EXAMPLE_LENGTH} caractere, nepăstrate goale.`,
      );
    }
  }
}

export async function createSession(opts: {
  studentId: string;
  tenantId: string;
  name: string;
  assignmentId?: string;
  examples: Example[];
}): Promise<SessionDetail> {
  validateExamples(opts.examples);

  if (opts.assignmentId) {
    const student = await db.student.findUnique({ where: { id: opts.studentId } });
    if (!student) throw new ForbiddenError('Student not found');
    const assignment = await db.assignment.findFirst({
      where: { id: opts.assignmentId, classId: student.classId },
    });
    if (!assignment) {
      throw new ForbiddenError('Assignment does not belong to your class');
    }
  }

  const session = await db.$transaction(async (tx) => {
    const created = await tx.lLMSession.create({
      data: {
        tenantId: opts.tenantId,
        studentId: opts.studentId,
        assignmentId: opts.assignmentId,
        name: opts.name,
      },
    });

    const version = await tx.lLMSessionVersion.create({
      data: {
        sessionId: created.id,
        versionNumber: 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        examples: opts.examples as any,
      },
    });

    await tx.lLMSession.update({
      where: { id: created.id },
      data: { currentVersionId: version.id },
    });

    return { sessionId: created.id, versionId: version.id };
  });

  return getSessionDetail(session.sessionId, opts.studentId);
}

export async function listMySessions(studentId: string): Promise<SessionSummary[]> {
  const sessions = await db.lLMSession.findMany({
    where: { studentId, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    include: {
      versions: { select: { versionNumber: true } },
      _count: { select: { queries: true } },
    },
  });

  const flaggedCounts = await db.lLMQuery.groupBy({
    by: ['sessionId'],
    where: {
      studentId,
      OR: [{ inputModerationFlagged: true }, { outputModerationFlagged: true }],
    },
    _count: true,
  });
  const flaggedMap = new Map(flaggedCounts.map((f) => [f.sessionId, f._count]));

  return sessions.map((s) => {
    const versions = s.versions.map((v) => v.versionNumber);
    const maxVersion = versions.length > 0 ? Math.max(...versions) : 0;
    return {
      id: s.id,
      name: s.name,
      assignmentId: s.assignmentId,
      currentVersionNumber: maxVersion,
      versionsCount: s.versions.length,
      queriesCount: s._count.queries,
      flaggedCount: flaggedMap.get(s.id) ?? 0,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  });
}

export async function getSessionDetail(
  sessionId: string,
  studentId: string,
): Promise<SessionDetail> {
  const session = await db.lLMSession.findFirst({
    where: { id: sessionId, studentId, deletedAt: null },
    include: {
      versions: { orderBy: { versionNumber: 'asc' } },
      _count: { select: { queries: true } },
    },
  });

  if (!session) throw new LLMSessionNotFoundError();

  const flaggedCount = await db.lLMQuery.count({
    where: {
      sessionId,
      OR: [{ inputModerationFlagged: true }, { outputModerationFlagged: true }],
    },
  });

  const maxVersion = Math.max(...session.versions.map((v) => v.versionNumber), 0);

  return {
    id: session.id,
    name: session.name,
    assignmentId: session.assignmentId,
    currentVersionNumber: maxVersion,
    versionsCount: session.versions.length,
    queriesCount: session._count.queries,
    flaggedCount,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    versions: session.versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      examples: v.examples as unknown as Example[],
      createdAt: v.createdAt.toISOString(),
    })),
  };
}

export async function addVersion(
  sessionId: string,
  studentId: string,
  examples: Example[],
): Promise<SessionDetail> {
  validateExamples(examples);

  const session = await db.lLMSession.findFirst({
    where: { id: sessionId, studentId, deletedAt: null },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
  });
  if (!session) throw new LLMSessionNotFoundError();

  const nextVersion = (session.versions[0]?.versionNumber ?? 0) + 1;

  const version = await db.lLMSessionVersion.create({
    data: {
      sessionId,
      versionNumber: nextVersion,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      examples: examples as any,
    },
  });

  await db.lLMSession.update({
    where: { id: sessionId },
    data: { currentVersionId: version.id, updatedAt: new Date() },
  });

  return getSessionDetail(sessionId, studentId);
}

export async function softDeleteSession(sessionId: string, studentId: string): Promise<void> {
  const session = await db.lLMSession.findFirst({
    where: { id: sessionId, studentId, deletedAt: null },
  });
  if (!session) throw new LLMSessionNotFoundError();

  await db.lLMSession.update({
    where: { id: sessionId },
    data: { deletedAt: new Date() },
  });
}

export async function listQueries(
  sessionId: string,
  studentId: string,
  version?: number,
): Promise<ChatHistoryItem[]> {
  const session = await db.lLMSession.findFirst({
    where: { id: sessionId, studentId, deletedAt: null },
  });
  if (!session) throw new LLMSessionNotFoundError();

  let versionId: string | undefined;
  if (version !== undefined) {
    const v = await db.lLMSessionVersion.findUnique({
      where: { sessionId_versionNumber: { sessionId, versionNumber: version } },
    });
    if (!v) return [];
    versionId = v.id;
  }

  const queries = await db.lLMQuery.findMany({
    where: { sessionId, ...(versionId ? { versionId } : {}) },
    orderBy: { createdAt: 'asc' },
  });

  return queries.map((q) => ({
    id: q.id,
    userPrompt: q.userPrompt,
    aiResponse: q.aiResponse,
    flagged: q.inputModerationFlagged || q.outputModerationFlagged,
    createdAt: q.createdAt.toISOString(),
  }));
}

export async function getQuota(studentId: string) {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(todayStart);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const used = await db.lLMQuery.count({
    where: { studentId, createdAt: { gte: todayStart } },
  });

  return {
    used,
    limit: env.LLM_MAX_QUERIES_PER_DAY,
    remaining: Math.max(0, env.LLM_MAX_QUERIES_PER_DAY - used),
    resetsAt: tomorrow.toISOString(),
  };
}
