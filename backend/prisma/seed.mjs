// TrainBot production seed — creates test teacher + class + student
// Run: node prisma/seed.mjs
// Requires: DATABASE_URL in environment (or .env loaded)

import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

// Inline bcrypt hash (node built-in, no import needed for simple case)
// Using dynamic import for bcryptjs which is already a dependency
const bcrypt = (await import('bcryptjs')).default;

const db = new PrismaClient();

const TEACHER_EMAIL = 'teacher@test.local';
const TEACHER_PASS  = 'TeacherPass2026!';
const TEACHER_NAME  = 'Profesor Test';
const TENANT_NAME   = 'Clasa Demo';
const TENANT_SLUG   = 'clasa-demo';
const CLASS_CODE    = 'TEST01';
const CLASS_NAME    = 'Clasa 7A Demo';
const STUDENT_USER  = 'eleva1';
const STUDENT_PASS  = 'Eleva2026!';
const STUDENT_NAME  = 'Eleva Demo';

async function main() {
  console.log('Seeding TrainBot production DB...');

  // 1. Tenant
  let tenant = await db.tenant.findUnique({ where: { slug: TENANT_SLUG } });
  if (!tenant) {
    tenant = await db.tenant.create({
      data: { name: TENANT_NAME, slug: TENANT_SLUG, plan: 'PILOT' },
    });
    console.log('Created tenant:', tenant.id);
  } else {
    console.log('Tenant already exists:', tenant.id);
  }

  // 2. Teacher
  let teacher = await db.teacher.findUnique({ where: { email: TEACHER_EMAIL } });
  if (!teacher) {
    const passwordHash = await bcrypt.hash(TEACHER_PASS, 12);
    teacher = await db.teacher.create({
      data: {
        tenantId: tenant.id,
        email: TEACHER_EMAIL,
        passwordHash,
        name: TEACHER_NAME,
        role: 'ADMIN',
      },
    });
    console.log('Created teacher:', teacher.id);
  } else {
    console.log('Teacher already exists:', teacher.id);
  }

  // 3. Class
  let klass = await db.class.findUnique({ where: { code: CLASS_CODE } });
  if (!klass) {
    klass = await db.class.create({
      data: {
        tenantId: tenant.id,
        teacherId: teacher.id,
        code: CLASS_CODE,
        name: CLASS_NAME,
      },
    });
    console.log('Created class:', klass.id, 'code:', CLASS_CODE);
  } else {
    console.log('Class already exists:', klass.id, 'code:', CLASS_CODE);
  }

  // 4. Student
  const existing = await db.student.findUnique({
    where: { classId_username: { classId: klass.id, username: STUDENT_USER } },
  });
  if (!existing) {
    const passwordHash = await bcrypt.hash(STUDENT_PASS, 12);
    const student = await db.student.create({
      data: {
        tenantId: tenant.id,
        classId: klass.id,
        username: STUDENT_USER,
        passwordHash,
        displayName: STUDENT_NAME,
      },
    });
    console.log('Created student:', student.id);
  } else {
    console.log('Student already exists:', existing.id);
  }

  console.log('\n=== SEED COMPLETE ===');
  console.log('Teacher login: email=' + TEACHER_EMAIL + ' pass=' + TEACHER_PASS);
  console.log('Student login: classCode=' + CLASS_CODE + ' username=' + STUDENT_USER + ' pass=' + STUDENT_PASS);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
