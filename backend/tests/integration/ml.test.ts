import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { db } from '../../src/lib/db.js';

const app = createApp();

beforeEach(async () => {
  await db.mLLabel.deleteMany();
  await db.mLProject.deleteMany();
  await db.refreshToken.deleteMany();
  await db.student.deleteMany();
  await db.class.deleteMany();
  await db.teacher.deleteMany();
  await db.tenant.deleteMany();
});

async function setupTeacherAndStudent() {
  const ts = Date.now();
  const teacherSignup = await request(app).post('/api/v1/auth/teacher/signup').send({
    email: `t-${ts}@b.ro`,
    password: 'verysecret',
    name: 'Teacher',
    tenantName: 'School',
    tenantSlug: `school-${ts}-${Math.floor(Math.random() * 1e6)}`,
  });
  const teacherToken = teacherSignup.body.accessToken as string;

  const klass = await request(app)
    .post('/api/v1/teacher/classes')
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({ name: 'C1' });

  const studentRes = await request(app)
    .post(`/api/v1/teacher/classes/${klass.body.id}/students`)
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({ username: 'ana', password: 'parola1', displayName: 'Ana' });

  const studentLogin = await request(app)
    .post('/api/v1/auth/student/login')
    .send({ classCode: klass.body.code, username: 'ana', password: 'parola1' });

  return {
    teacherToken,
    classId: klass.body.id as string,
    classCode: klass.body.code as string,
    studentId: studentRes.body.id as string,
    studentToken: studentLogin.body.accessToken as string,
  };
}

describe('ML sync', () => {
  it('POST /student/ml/projects without auth returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/student/ml/projects')
      .send({ clientId: 'c1', name: 'Cats vs Dogs' });
    expect(res.status).toBe(401);
  });

  it('teacher cannot use student endpoints (403)', async () => {
    const { teacherToken } = await setupTeacherAndStudent();
    const res = await request(app)
      .get('/api/v1/student/ml/projects')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(403);
  });

  it('student creates project + labels via sync', async () => {
    const { studentToken } = await setupTeacherAndStudent();
    const res = await request(app)
      .post('/api/v1/student/ml/projects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        clientId: 'proj-1',
        name: 'Cats vs Dogs',
        labels: [
          { clientId: 'lab-cat', name: 'cat', imageCount: 5 },
          { clientId: 'lab-dog', name: 'dog', imageCount: 3 },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Cats vs Dogs');
    expect(res.body.labels).toHaveLength(2);
    expect(res.body.labels.find((l: { name: string }) => l.name === 'cat').imageCount).toBe(5);
  });

  it('sync is idempotent: same clientId updates instead of duplicating', async () => {
    const { studentToken } = await setupTeacherAndStudent();
    await request(app)
      .post('/api/v1/student/ml/projects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ clientId: 'proj-1', name: 'V1', labels: [] });
    const res = await request(app)
      .post('/api/v1/student/ml/projects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ clientId: 'proj-1', name: 'V2', labels: [] });
    expect(res.body.name).toBe('V2');

    const list = await request(app)
      .get('/api/v1/student/ml/projects')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(list.body.data).toHaveLength(1);
  });

  it('sync removes labels not in payload', async () => {
    const { studentToken } = await setupTeacherAndStudent();
    await request(app)
      .post('/api/v1/student/ml/projects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        clientId: 'p1',
        name: 'P',
        labels: [
          { clientId: 'a', name: 'A', imageCount: 1 },
          { clientId: 'b', name: 'B', imageCount: 2 },
        ],
      });
    const res = await request(app)
      .post('/api/v1/student/ml/projects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        clientId: 'p1',
        name: 'P',
        labels: [{ clientId: 'a', name: 'A', imageCount: 7 }],
      });
    expect(res.body.labels).toHaveLength(1);
    expect(res.body.labels[0].imageCount).toBe(7);
  });

  it('teacher can read student projects from their class', async () => {
    const { studentToken, teacherToken, studentId } = await setupTeacherAndStudent();
    await request(app)
      .post('/api/v1/student/ml/projects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        clientId: 'proj-1',
        name: 'Ana proj',
        labels: [{ clientId: 'l1', name: 'fruits', imageCount: 4 }],
      });

    const teacherView = await request(app)
      .get(`/api/v1/teacher/students/${studentId}/ml-projects`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(teacherView.status).toBe(200);
    expect(teacherView.body.data).toHaveLength(1);
    expect(teacherView.body.data[0].name).toBe('Ana proj');
    expect(teacherView.body.data[0].labels[0].imageCount).toBe(4);
  });

  it('teacher cannot see students from other tenants', async () => {
    const setupA = await setupTeacherAndStudent();
    await request(app)
      .post('/api/v1/student/ml/projects')
      .set('Authorization', `Bearer ${setupA.studentToken}`)
      .send({ clientId: 'p', name: 'A proj', labels: [] });

    const setupB = await setupTeacherAndStudent();

    const res = await request(app)
      .get(`/api/v1/teacher/students/${setupA.studentId}/ml-projects`)
      .set('Authorization', `Bearer ${setupB.teacherToken}`);

    expect(res.status).toBe(404);
  });

  it('teacher class overview returns aggregated student projects', async () => {
    const { studentToken, teacherToken, classId } = await setupTeacherAndStudent();
    await request(app)
      .post('/api/v1/student/ml/projects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        clientId: 'p',
        name: 'Sample',
        labels: [{ clientId: 'l', name: 'cats', imageCount: 8 }],
      });

    const overview = await request(app)
      .get(`/api/v1/teacher/classes/${classId}/ml-projects`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(overview.status).toBe(200);
    expect(overview.body.data).toHaveLength(1);
    expect(overview.body.data[0].student.username).toBe('ana');
  });

  it('student deletes own project', async () => {
    const { studentToken } = await setupTeacherAndStudent();
    const create = await request(app)
      .post('/api/v1/student/ml/projects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ clientId: 'p', name: 'X', labels: [] });

    const del = await request(app)
      .delete(`/api/v1/student/ml/projects/${create.body.id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(del.status).toBe(204);

    const list = await request(app)
      .get('/api/v1/student/ml/projects')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(list.body.data).toHaveLength(0);
  });
});
