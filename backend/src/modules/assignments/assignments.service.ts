import { db } from '../../lib/db.js';
import { NotFoundError, ForbiddenError } from '../../lib/errors.js';
import type { AssignmentType } from '@prisma/client';

export async function teacherCreate(opts: {
  teacherId: string;
  tenantId: string;
  classId: string;
  title: string;
  description: string;
  dueAt?: string;
  type?: AssignmentType;
}) {
  const klass = await db.class.findFirst({
    where: { id: opts.classId, teacherId: opts.teacherId, tenantId: opts.tenantId },
  });
  if (!klass) throw new NotFoundError('class');
  return db.assignment.create({
    data: {
      tenantId: opts.tenantId,
      classId: opts.classId,
      title: opts.title,
      description: opts.description,
      dueAt: opts.dueAt ? new Date(opts.dueAt) : null,
      ...(opts.type !== undefined ? { type: opts.type } : {}),
    },
  });
}

export async function teacherListByClass(opts: {
  teacherId: string;
  tenantId: string;
  classId: string;
}) {
  const klass = await db.class.findFirst({
    where: { id: opts.classId, teacherId: opts.teacherId, tenantId: opts.tenantId },
  });
  if (!klass) throw new NotFoundError('class');
  return db.assignment.findMany({
    where: { classId: opts.classId, archivedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { submissions: true } } },
  });
}

export async function teacherGetDetail(opts: {
  teacherId: string;
  tenantId: string;
  assignmentId: string;
}) {
  const a = await db.assignment.findFirst({
    where: {
      id: opts.assignmentId,
      tenantId: opts.tenantId,
      class: { teacherId: opts.teacherId },
    },
    include: {
      submissions: {
        orderBy: { submittedAt: 'desc' },
      },
      class: { select: { id: true, code: true, name: true } },
    },
  });
  if (!a) throw new NotFoundError('assignment');

  // Hydrate student info for each submission (student lives outside Assignment relation)
  const studentIds = [...new Set(a.submissions.map((s) => s.studentId))];
  const students = await db.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, username: true, displayName: true },
  });
  const byId = new Map(students.map((s) => [s.id, s]));
  return {
    ...a,
    submissions: a.submissions.map((s) => ({ ...s, student: byId.get(s.studentId) ?? null })),
  };
}

export async function teacherUpdate(opts: {
  teacherId: string;
  tenantId: string;
  assignmentId: string;
  title?: string;
  description?: string;
  dueAt?: string | null;
  type?: AssignmentType;
}) {
  const a = await db.assignment.findFirst({
    where: {
      id: opts.assignmentId,
      tenantId: opts.tenantId,
      class: { teacherId: opts.teacherId },
    },
  });
  if (!a) throw new NotFoundError('assignment');
  return db.assignment.update({
    where: { id: a.id },
    data: {
      ...(opts.title !== undefined ? { title: opts.title } : {}),
      ...(opts.description !== undefined ? { description: opts.description } : {}),
      ...(opts.dueAt !== undefined ? { dueAt: opts.dueAt === null ? null : new Date(opts.dueAt) } : {}),
      ...(opts.type !== undefined ? { type: opts.type } : {}),
    },
  });
}

export async function teacherArchive(opts: {
  teacherId: string;
  tenantId: string;
  assignmentId: string;
}) {
  const a = await db.assignment.findFirst({
    where: {
      id: opts.assignmentId,
      tenantId: opts.tenantId,
      class: { teacherId: opts.teacherId },
    },
  });
  if (!a) throw new NotFoundError('assignment');
  await db.assignment.update({ where: { id: a.id }, data: { archivedAt: new Date() } });
}

// Student endpoints

export async function studentList(opts: { studentId: string; tenantId: string }) {
  const student = await db.student.findUnique({ where: { id: opts.studentId } });
  if (!student) throw new NotFoundError('student');
  return db.assignment.findMany({
    where: {
      classId: student.classId,
      archivedAt: null,
    },
    orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
    include: {
      submissions: {
        where: { studentId: opts.studentId },
        select: { id: true, submittedAt: true, mlProjectId: true, notes: true },
      },
    },
  });
}

export async function studentSubmit(opts: {
  studentId: string;
  tenantId: string;
  assignmentId: string;
  mlProjectId?: string;
  notes?: string;
}) {
  const student = await db.student.findUnique({ where: { id: opts.studentId } });
  if (!student) throw new NotFoundError('student');

  const a = await db.assignment.findFirst({
    where: { id: opts.assignmentId, classId: student.classId, archivedAt: null },
  });
  if (!a) throw new NotFoundError('assignment');

  if (opts.mlProjectId) {
    const proj = await db.mLProject.findUnique({ where: { id: opts.mlProjectId } });
    if (!proj || proj.studentId !== opts.studentId) {
      throw new ForbiddenError('Cannot link a project that is not yours');
    }
  }

  return db.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId: opts.assignmentId, studentId: opts.studentId } },
    update: {
      mlProjectId: opts.mlProjectId ?? null,
      notes: opts.notes ?? null,
      submittedAt: new Date(),
    },
    create: {
      assignmentId: opts.assignmentId,
      studentId: opts.studentId,
      mlProjectId: opts.mlProjectId ?? null,
      notes: opts.notes ?? null,
    },
  });
}
