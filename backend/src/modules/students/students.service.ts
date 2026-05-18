import { db } from '../../lib/db.js';
import { hashPassword } from '../../services/passwordService.js';
import { NotFoundError, ConflictError } from '../../lib/errors.js';

async function ensureClassOwnedByTeacher(opts: {
  classId: string;
  teacherId: string;
  tenantId: string;
}) {
  const klass = await db.class.findFirst({
    where: { id: opts.classId, teacherId: opts.teacherId, tenantId: opts.tenantId },
  });
  if (!klass) throw new NotFoundError('class');
  return klass;
}

export async function createStudent(opts: {
  classId: string;
  teacherId: string;
  tenantId: string;
  username: string;
  password: string;
  displayName?: string;
}) {
  await ensureClassOwnedByTeacher(opts);

  const existing = await db.student.findUnique({
    where: { classId_username: { classId: opts.classId, username: opts.username } },
  });
  if (existing) throw new ConflictError('Username already exists in this class');

  const passwordHash = await hashPassword(opts.password);
  return db.student.create({
    data: {
      tenantId: opts.tenantId,
      classId: opts.classId,
      username: opts.username,
      passwordHash,
      displayName: opts.displayName,
    },
    select: { id: true, username: true, displayName: true, createdAt: true },
  });
}

export async function bulkCreateStudents(opts: {
  classId: string;
  teacherId: string;
  tenantId: string;
  students: Array<{ username: string; password: string; displayName?: string }>;
}) {
  await ensureClassOwnedByTeacher(opts);

  const usernames = opts.students.map((s) => s.username);
  const dupes = usernames.filter((u, i) => usernames.indexOf(u) !== i);
  if (dupes.length > 0) {
    throw new ConflictError(`Duplicate usernames in batch: ${[...new Set(dupes)].join(', ')}`);
  }

  const existing = await db.student.findMany({
    where: { classId: opts.classId, username: { in: usernames } },
    select: { username: true },
  });
  if (existing.length > 0) {
    throw new ConflictError(
      `Usernames already exist: ${existing.map((s) => s.username).join(', ')}`,
    );
  }

  // Hash all passwords first (parallel), then bulk insert in a single transaction
  const hashes = await Promise.all(opts.students.map((s) => hashPassword(s.password)));
  const created = await db.$transaction(
    opts.students.map((s, idx) =>
      db.student.create({
        data: {
          tenantId: opts.tenantId,
          classId: opts.classId,
          username: s.username,
          passwordHash: hashes[idx]!,
          displayName: s.displayName,
        },
      }),
    ),
  );

  return { created: created.length };
}

export async function resetStudentPassword(opts: {
  studentId: string;
  teacherId: string;
  tenantId: string;
  newPassword: string;
}) {
  const student = await db.student.findFirst({
    where: {
      id: opts.studentId,
      tenantId: opts.tenantId,
      class: { teacherId: opts.teacherId },
    },
  });
  if (!student) throw new NotFoundError('student');

  const passwordHash = await hashPassword(opts.newPassword);
  await db.student.update({ where: { id: student.id }, data: { passwordHash } });

  await db.refreshToken.updateMany({
    where: { studentId: student.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function deleteStudent(opts: {
  studentId: string;
  teacherId: string;
  tenantId: string;
}) {
  const student = await db.student.findFirst({
    where: {
      id: opts.studentId,
      tenantId: opts.tenantId,
      class: { teacherId: opts.teacherId },
    },
  });
  if (!student) throw new NotFoundError('student');
  await db.student.delete({ where: { id: student.id } });
}
