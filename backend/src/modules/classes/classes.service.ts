import { db } from '../../lib/db.js';
import { generateClassCode } from '../auth/auth.service.js';
import { NotFoundError, ConflictError } from '../../lib/errors.js';

export async function listClasses(opts: { teacherId: string; tenantId: string }) {
  return db.class.findMany({
    where: { teacherId: opts.teacherId, tenantId: opts.tenantId, archivedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      createdAt: true,
      _count: { select: { students: true } },
    },
  });
}

export async function createClass(opts: {
  teacherId: string;
  tenantId: string;
  name: string;
  description?: string;
}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateClassCode();
    const existing = await db.class.findUnique({ where: { code } });
    if (existing) continue;
    return db.class.create({
      data: {
        tenantId: opts.tenantId,
        teacherId: opts.teacherId,
        code,
        name: opts.name,
        description: opts.description,
      },
    });
  }
  throw new ConflictError('Could not allocate a unique class code; please retry');
}

export async function updateClass(opts: {
  classId: string;
  teacherId: string;
  tenantId: string;
  name?: string;
  description?: string;
}) {
  const klass = await db.class.findFirst({
    where: { id: opts.classId, teacherId: opts.teacherId, tenantId: opts.tenantId },
  });
  if (!klass) throw new NotFoundError('class');
  return db.class.update({
    where: { id: klass.id },
    data: { name: opts.name, description: opts.description },
  });
}

export async function archiveClass(opts: {
  classId: string;
  teacherId: string;
  tenantId: string;
}) {
  const klass = await db.class.findFirst({
    where: { id: opts.classId, teacherId: opts.teacherId, tenantId: opts.tenantId },
  });
  if (!klass) throw new NotFoundError('class');
  return db.class.update({
    where: { id: klass.id },
    data: { archivedAt: new Date() },
  });
}

export async function getClassById(opts: {
  classId: string;
  teacherId: string;
  tenantId: string;
}) {
  const klass = await db.class.findFirst({
    where: {
      id: opts.classId,
      teacherId: opts.teacherId,
      tenantId: opts.tenantId,
      archivedAt: null,
    },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      createdAt: true,
      students: {
        select: {
          id: true,
          username: true,
          displayName: true,
          createdAt: true,
          lastSeenAt: true,
        },
        orderBy: { username: 'asc' },
      },
    },
  });
  if (!klass) throw new NotFoundError('class');
  return klass;
}
