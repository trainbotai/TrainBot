import { db } from '../../lib/db.js';
import { NotFoundError, ForbiddenError } from '../../lib/errors.js';
import type { SyncProjectBody } from './ml.schemas.js';

// Student: list own projects
export async function listOwnProjects(opts: { studentId: string; tenantId: string }) {
  return db.mLProject.findMany({
    where: { studentId: opts.studentId, tenantId: opts.tenantId },
    orderBy: { updatedAt: 'desc' },
    include: {
      labels: {
        select: { id: true, clientId: true, name: true, imageCount: true, updatedAt: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

// Student: upsert project (idempotent via clientId)
export async function syncProject(opts: {
  studentId: string;
  tenantId: string;
  body: SyncProjectBody;
}) {
  const { studentId, tenantId, body } = opts;

  return db.$transaction(async (tx) => {
    const project = await tx.mLProject.upsert({
      where: { studentId_clientId: { studentId, clientId: body.clientId } },
      update: {
        name: body.name,
        modelTrained: body.modelTrained ?? false,
        modelVersion: body.modelVersion ?? 0,
        trainedAt: body.trainedAt ? new Date(body.trainedAt) : null,
      },
      create: {
        tenantId,
        studentId,
        clientId: body.clientId,
        name: body.name,
        modelTrained: body.modelTrained ?? false,
        modelVersion: body.modelVersion ?? 0,
        trainedAt: body.trainedAt ? new Date(body.trainedAt) : null,
      },
    });

    const incomingClientIds = body.labels.map((l) => l.clientId);

    // Delete labels removed on client (replace-style sync)
    await tx.mLLabel.deleteMany({
      where: {
        projectId: project.id,
        ...(incomingClientIds.length > 0 ? { clientId: { notIn: incomingClientIds } } : {}),
      },
    });

    // Upsert each label
    for (const label of body.labels) {
      await tx.mLLabel.upsert({
        where: { projectId_clientId: { projectId: project.id, clientId: label.clientId } },
        update: { name: label.name, imageCount: label.imageCount },
        create: {
          projectId: project.id,
          clientId: label.clientId,
          name: label.name,
          imageCount: label.imageCount,
        },
      });
    }

    return tx.mLProject.findUniqueOrThrow({
      where: { id: project.id },
      include: {
        labels: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  });
}

// Student: delete own project
export async function deleteOwnProject(opts: {
  studentId: string;
  projectId: string;
}) {
  const project = await db.mLProject.findUnique({ where: { id: opts.projectId } });
  if (!project) throw new NotFoundError('project');
  if (project.studentId !== opts.studentId) {
    throw new ForbiddenError('Not your project');
  }
  await db.mLProject.delete({ where: { id: opts.projectId } });
}

// Teacher: list projects for one of their students (multi-tenant safe)
export async function teacherListStudentProjects(opts: {
  teacherId: string;
  tenantId: string;
  studentId: string;
}) {
  const student = await db.student.findFirst({
    where: {
      id: opts.studentId,
      tenantId: opts.tenantId,
      class: { teacherId: opts.teacherId },
    },
  });
  if (!student) throw new NotFoundError('student');

  return db.mLProject.findMany({
    where: { studentId: opts.studentId },
    orderBy: { updatedAt: 'desc' },
    include: {
      labels: {
        select: { id: true, name: true, imageCount: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

// Teacher: list projects for entire class (aggregated overview)
export async function teacherListClassProjects(opts: {
  teacherId: string;
  tenantId: string;
  classId: string;
}) {
  const klass = await db.class.findFirst({
    where: { id: opts.classId, teacherId: opts.teacherId, tenantId: opts.tenantId },
  });
  if (!klass) throw new NotFoundError('class');

  return db.mLProject.findMany({
    where: { student: { classId: opts.classId } },
    orderBy: { updatedAt: 'desc' },
    include: {
      student: { select: { id: true, username: true, displayName: true } },
      labels: { select: { name: true, imageCount: true } },
    },
  });
}
