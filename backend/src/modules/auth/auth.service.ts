import { createHash, randomBytes } from 'node:crypto';
import { db } from '../../lib/db.js';
import { hashPassword, verifyPassword } from '../../services/passwordService.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../services/tokenService.js';
import { ConflictError, UnauthorizedError } from '../../lib/errors.js';
import type {
  TeacherSignupBody,
  TeacherLoginBody,
  StudentLoginBody,
  RefreshBody,
} from './auth.schemas.js';

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    role: 'teacher' | 'student';
    name: string;
    tenantId: string;
  };
}

const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function createRefreshTokenRecord(opts: {
  teacherId?: string;
  studentId?: string;
  rawToken: string;
}) {
  await db.refreshToken.create({
    data: {
      tokenHash: hashToken(opts.rawToken),
      teacherId: opts.teacherId,
      studentId: opts.studentId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
}

export async function signupTeacher(body: TeacherSignupBody): Promise<AuthResult> {
  const existing = await db.teacher.findUnique({ where: { email: body.email } });
  if (existing) {
    throw new ConflictError('A teacher account with this email already exists');
  }
  const tenantBySlug = await db.tenant.findUnique({ where: { slug: body.tenantSlug } });
  if (tenantBySlug) {
    throw new ConflictError('Tenant slug already taken');
  }

  const passwordHash = await hashPassword(body.password);

  const result = await db.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: body.tenantName, slug: body.tenantSlug },
    });
    const teacher = await tx.teacher.create({
      data: {
        tenantId: tenant.id,
        email: body.email,
        passwordHash,
        name: body.name,
        role: 'ADMIN',
      },
    });
    return { tenant, teacher };
  });

  const accessToken = signAccessToken({
    sub: result.teacher.id,
    role: 'teacher',
    tenantId: result.tenant.id,
  });
  const refreshToken = signRefreshToken({ sub: result.teacher.id });
  await createRefreshTokenRecord({ teacherId: result.teacher.id, rawToken: refreshToken });

  return {
    accessToken,
    refreshToken,
    user: {
      id: result.teacher.id,
      role: 'teacher',
      name: result.teacher.name,
      tenantId: result.tenant.id,
    },
  };
}

export async function loginTeacher(body: TeacherLoginBody): Promise<AuthResult> {
  const teacher = await db.teacher.findUnique({ where: { email: body.email } });
  if (!teacher) {
    throw new UnauthorizedError('Invalid email or password');
  }
  const ok = await verifyPassword(body.password, teacher.passwordHash);
  if (!ok) {
    throw new UnauthorizedError('Invalid email or password');
  }

  await db.teacher.update({
    where: { id: teacher.id },
    data: { lastLoginAt: new Date() },
  });

  const accessToken = signAccessToken({
    sub: teacher.id,
    role: 'teacher',
    tenantId: teacher.tenantId,
  });
  const refreshToken = signRefreshToken({ sub: teacher.id });
  await createRefreshTokenRecord({ teacherId: teacher.id, rawToken: refreshToken });

  return {
    accessToken,
    refreshToken,
    user: {
      id: teacher.id,
      role: 'teacher',
      name: teacher.name,
      tenantId: teacher.tenantId,
    },
  };
}

export async function loginStudent(body: StudentLoginBody): Promise<AuthResult> {
  const klass = await db.class.findUnique({ where: { code: body.classCode } });
  if (!klass || klass.archivedAt) {
    throw new UnauthorizedError('Invalid class code, username, or password');
  }
  const student = await db.student.findUnique({
    where: { classId_username: { classId: klass.id, username: body.username } },
  });
  if (!student) {
    throw new UnauthorizedError('Invalid class code, username, or password');
  }
  const ok = await verifyPassword(body.password, student.passwordHash);
  if (!ok) {
    throw new UnauthorizedError('Invalid class code, username, or password');
  }

  await db.student.update({
    where: { id: student.id },
    data: { lastSeenAt: new Date() },
  });

  const accessToken = signAccessToken({
    sub: student.id,
    role: 'student',
    tenantId: student.tenantId,
  });
  const refreshToken = signRefreshToken({ sub: student.id });
  await createRefreshTokenRecord({ studentId: student.id, rawToken: refreshToken });

  return {
    accessToken,
    refreshToken,
    user: {
      id: student.id,
      role: 'student',
      name: student.displayName ?? student.username,
      tenantId: student.tenantId,
    },
  };
}

export async function refreshTokens(body: RefreshBody): Promise<AuthResult> {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(body.refreshToken);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // payload.sub is not used directly — the DB record links to the entity
  void payload;

  const tokenHash = hashToken(body.refreshToken);
  const record = await db.refreshToken.findUnique({ where: { tokenHash } });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token revoked or expired');
  }

  // Revoke old token, issue new pair (rotation)
  await db.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  if (record.teacherId) {
    const teacher = await db.teacher.findUnique({ where: { id: record.teacherId } });
    if (!teacher) throw new UnauthorizedError('Account no longer exists');
    const accessToken = signAccessToken({
      sub: teacher.id,
      role: 'teacher',
      tenantId: teacher.tenantId,
    });
    const refreshToken = signRefreshToken({ sub: teacher.id });
    await createRefreshTokenRecord({ teacherId: teacher.id, rawToken: refreshToken });
    return {
      accessToken,
      refreshToken,
      user: { id: teacher.id, role: 'teacher', name: teacher.name, tenantId: teacher.tenantId },
    };
  }

  if (record.studentId) {
    const student = await db.student.findUnique({ where: { id: record.studentId } });
    if (!student) throw new UnauthorizedError('Account no longer exists');
    const accessToken = signAccessToken({
      sub: student.id,
      role: 'student',
      tenantId: student.tenantId,
    });
    const refreshToken = signRefreshToken({ sub: student.id });
    await createRefreshTokenRecord({ studentId: student.id, rawToken: refreshToken });
    return {
      accessToken,
      refreshToken,
      user: {
        id: student.id,
        role: 'student',
        name: student.displayName ?? student.username,
        tenantId: student.tenantId,
      },
    };
  }

  throw new UnauthorizedError('Refresh token has no associated user');
}

export async function logout(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);
  await db.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function generateClassCode(): string {
  // Format: AB-12CD (6 chars + dash, easy to type, no ambiguous chars)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pick = () => {
    const byte = randomBytes(1)[0]!;
    return alphabet[Math.floor((byte / 256) * alphabet.length)]!;
  };
  return `${pick()}${pick()}-${pick()}${pick()}${pick()}${pick()}`;
}
