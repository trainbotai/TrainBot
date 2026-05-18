import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { db } from '../../src/lib/db.js';

const app = createApp();

beforeEach(async () => {
  await db.refreshToken.deleteMany();
  await db.student.deleteMany();
  await db.class.deleteMany();
  await db.teacher.deleteMany();
  await db.tenant.deleteMany();
});

describe('Auth — teacher signup + login flow', () => {
  it('signup creates tenant + teacher and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/teacher/signup')
      .send({
        email: 'a@b.ro',
        password: 'verysecret',
        name: 'Ana',
        tenantName: 'Test School',
        tenantSlug: 'test-school',
      });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(res.body.refreshToken).toBeTypeOf('string');
    expect(res.body.user.role).toBe('teacher');
  });

  it('signup with duplicate email returns 409', async () => {
    await request(app).post('/api/v1/auth/teacher/signup').send({
      email: 'a@b.ro',
      password: 'verysecret',
      name: 'Ana',
      tenantName: 'School A',
      tenantSlug: 'school-a',
    });
    const res = await request(app).post('/api/v1/auth/teacher/signup').send({
      email: 'a@b.ro',
      password: 'verysecret',
      name: 'Ana 2',
      tenantName: 'School B',
      tenantSlug: 'school-b',
    });
    expect(res.status).toBe(409);
  });

  it('login with correct credentials returns tokens', async () => {
    await request(app).post('/api/v1/auth/teacher/signup').send({
      email: 'a@b.ro',
      password: 'verysecret',
      name: 'Ana',
      tenantName: 'School',
      tenantSlug: 'school',
    });
    const res = await request(app)
      .post('/api/v1/auth/teacher/login')
      .send({ email: 'a@b.ro', password: 'verysecret' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf('string');
  });

  it('login with wrong password returns 401', async () => {
    await request(app).post('/api/v1/auth/teacher/signup').send({
      email: 'a@b.ro',
      password: 'verysecret',
      name: 'Ana',
      tenantName: 'School',
      tenantSlug: 'school',
    });
    const res = await request(app)
      .post('/api/v1/auth/teacher/login')
      .send({ email: 'a@b.ro', password: 'WRONG' });
    expect(res.status).toBe(401);
  });

  it('refresh rotates tokens', async () => {
    const signup = await request(app).post('/api/v1/auth/teacher/signup').send({
      email: 'a@b.ro',
      password: 'verysecret',
      name: 'Ana',
      tenantName: 'School',
      tenantSlug: 'school',
    });
    const refreshToken = signup.body.refreshToken as string;

    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.refreshToken).not.toBe(refreshToken);

    const reuse = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(reuse.status).toBe(401);
  });
});

describe('Auth — student login', () => {
  it('student can login with class code + username + password', async () => {
    const signup = await request(app).post('/api/v1/auth/teacher/signup').send({
      email: 't@b.ro',
      password: 'verysecret',
      name: 'T',
      tenantName: 'School',
      tenantSlug: 'school',
    });
    const teacherToken = signup.body.accessToken as string;

    const classRes = await request(app)
      .post('/api/v1/teacher/classes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ name: 'Class A' });
    const code = classRes.body.code as string;
    const classId = classRes.body.id as string;

    await request(app)
      .post(`/api/v1/teacher/classes/${classId}/students`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ username: 'maria', password: 'kidpass' });

    const studentLogin = await request(app)
      .post('/api/v1/auth/student/login')
      .send({ classCode: code, username: 'maria', password: 'kidpass' });
    expect(studentLogin.status).toBe(200);
    expect(studentLogin.body.user.role).toBe('student');
  });
});
