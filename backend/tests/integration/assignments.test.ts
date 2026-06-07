import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { db } from '../../src/lib/db.js';

const app = createApp();

beforeEach(async () => {
  await db.assignmentSubmission.deleteMany();
  await db.assignment.deleteMany();
  await db.mLImage.deleteMany();
  await db.mLLabel.deleteMany();
  await db.mLProject.deleteMany();
  await db.refreshToken.deleteMany();
  await db.student.deleteMany();
  await db.class.deleteMany();
  await db.teacher.deleteMany();
  await db.tenant.deleteMany();
});

async function setup() {
  const ts = Date.now();
  const teacher = await request(app).post('/api/v1/auth/teacher/signup').send({
    email: `t-${ts}-${Math.random()}@b.ro`,
    password: 'verysecret',
    name: 'T',
    tenantName: 'School',
    tenantSlug: `school-${ts}-${Math.floor(Math.random() * 1e6)}`,
  });
  const tt = teacher.body.accessToken as string;

  const klass = await request(app)
    .post('/api/v1/teacher/classes')
    .set('Authorization', `Bearer ${tt}`)
    .send({ name: 'C1' });

  await request(app)
    .post(`/api/v1/teacher/classes/${klass.body.id}/students`)
    .set('Authorization', `Bearer ${tt}`)
    .send({ username: 'ana', password: 'parola1', displayName: 'Ana' });

  const login = await request(app)
    .post('/api/v1/auth/student/login')
    .send({ classCode: klass.body.code, username: 'ana', password: 'parola1' });

  return {
    teacherToken: tt,
    studentToken: login.body.accessToken as string,
    studentId: login.body.user.id as string,
    classId: klass.body.id as string,
  };
}

describe('Assignments', () => {
  it('teacher creates assignment in own class', async () => {
    const ctx = await setup();
    const res = await request(app)
      .post(`/api/v1/teacher/classes/${ctx.classId}/assignments`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`)
      .send({ title: 'Antrenează un model fructe', description: 'Min 3 etichete, 5 imagini fiecare.' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Antrenează un model fructe');
    expect(res.body.classId).toBe(ctx.classId);
  });

  it('student lists assignments in own class only', async () => {
    const ctx = await setup();
    await request(app)
      .post(`/api/v1/teacher/classes/${ctx.classId}/assignments`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`)
      .send({ title: 'A1', description: 'd1' });

    const res = await request(app)
      .get('/api/v1/student/assignments')
      .set('Authorization', `Bearer ${ctx.studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('A1');
    expect(res.body.data[0].submissions).toHaveLength(0);
  });

  it('student submits assignment, idempotent on resubmit', async () => {
    const ctx = await setup();
    const a = await request(app)
      .post(`/api/v1/teacher/classes/${ctx.classId}/assignments`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`)
      .send({ title: 'A1', description: 'd1' });

    const sub1 = await request(app)
      .post(`/api/v1/student/assignments/${a.body.id}/submit`)
      .set('Authorization', `Bearer ${ctx.studentToken}`)
      .send({ notes: 'gata' });
    expect(sub1.status).toBe(200);

    const sub2 = await request(app)
      .post(`/api/v1/student/assignments/${a.body.id}/submit`)
      .set('Authorization', `Bearer ${ctx.studentToken}`)
      .send({ notes: 'updated' });
    expect(sub2.status).toBe(200);
    expect(sub2.body.id).toBe(sub1.body.id);
    expect(sub2.body.notes).toBe('updated');
  });

  it('teacher sees submissions in detail', async () => {
    const ctx = await setup();
    const a = await request(app)
      .post(`/api/v1/teacher/classes/${ctx.classId}/assignments`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`)
      .send({ title: 'A1', description: 'd1' });

    await request(app)
      .post(`/api/v1/student/assignments/${a.body.id}/submit`)
      .set('Authorization', `Bearer ${ctx.studentToken}`)
      .send({ notes: 'submitted' });

    const det = await request(app)
      .get(`/api/v1/teacher/assignments/${a.body.id}`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`);
    expect(det.status).toBe(200);
    expect(det.body.submissions).toHaveLength(1);
    expect(det.body.submissions[0].student.username).toBe('ana');
    expect(det.body.submissions[0].notes).toBe('submitted');
  });

  it('teacher cannot create assignment in another teacher\'s class', async () => {
    const ctxA = await setup();
    const ctxB = await setup();
    const res = await request(app)
      .post(`/api/v1/teacher/classes/${ctxA.classId}/assignments`)
      .set('Authorization', `Bearer ${ctxB.teacherToken}`)
      .send({ title: 'evil', description: 'evil' });
    expect(res.status).toBe(404);
  });

  it('archive removes from list but preserves data', async () => {
    const ctx = await setup();
    const a = await request(app)
      .post(`/api/v1/teacher/classes/${ctx.classId}/assignments`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`)
      .send({ title: 'A1', description: 'd1' });

    await request(app)
      .delete(`/api/v1/teacher/assignments/${a.body.id}`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`)
      .expect(204);

    const list = await request(app)
      .get(`/api/v1/teacher/classes/${ctx.classId}/assignments`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`);
    expect(list.body.data).toHaveLength(0);
  });

  it('creates assignment with type=LLM_TRAINING', async () => {
    const ctx = await setup();
    const res = await request(app)
      .post(`/api/v1/teacher/classes/${ctx.classId}/assignments`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`)
      .send({ title: 'LLM task', description: 'scrie un prompt bun', type: 'LLM_TRAINING' });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('LLM_TRAINING');
  });

  it('defaults to ML_TRAINING when type omitted', async () => {
    const ctx = await setup();
    const res = await request(app)
      .post(`/api/v1/teacher/classes/${ctx.classId}/assignments`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`)
      .send({ title: 'Default task', description: 'fara type' });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('ML_TRAINING');
  });

  it('student linking ml project requires ownership', async () => {
    const ctxA = await setup();
    const projA = await request(app)
      .post('/api/v1/student/ml/projects')
      .set('Authorization', `Bearer ${ctxA.studentToken}`)
      .send({ clientId: 'p1', name: 'P', labels: [] });

    const ctxB = await setup();
    const a = await request(app)
      .post(`/api/v1/teacher/classes/${ctxB.classId}/assignments`)
      .set('Authorization', `Bearer ${ctxB.teacherToken}`)
      .send({ title: 'A1', description: 'd1' });

    const res = await request(app)
      .post(`/api/v1/student/assignments/${a.body.id}/submit`)
      .set('Authorization', `Bearer ${ctxB.studentToken}`)
      .send({ mlProjectId: projA.body.id });
    expect(res.status).toBe(403);
  });
});
