import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { db } from '../../src/lib/db.js';

vi.mock('../../src/modules/llm/providers/groq.js', () => ({
  GroqProvider: vi.fn().mockImplementation(() => ({
    name: 'groq',
    chat: vi.fn().mockResolvedValue({
      content: 'ok',
      inputTokens: 10,
      outputTokens: 5,
      latencyMs: 100,
    }),
  })),
}));

vi.mock('../../src/modules/llm/safety/moderation.js', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/modules/llm/safety/moderation.js')
  >('../../src/modules/llm/safety/moderation.js');
  return { ...actual, checkModeration: vi.fn().mockResolvedValue({ safe: true }) };
});

const app = createApp();

beforeEach(async () => {
  await db.lLMReport.deleteMany();
  await db.lLMQuery.deleteMany();
  await db.lLMSessionVersion.deleteMany();
  await db.lLMSession.deleteMany();
  await db.assignmentSubmission.deleteMany();
  await db.assignment.deleteMany();
  await db.mLLabel.deleteMany();
  await db.mLProject.deleteMany();
  await db.refreshToken.deleteMany();
  await db.student.deleteMany();
  await db.class.deleteMany();
  await db.teacher.deleteMany();
  await db.tenant.deleteMany();
});

async function setupFullStack() {
  const ts = Date.now();
  const teacher = await request(app).post('/api/v1/auth/teacher/signup').send({
    email: `t-${ts}@b.ro`,
    password: 'verysecret',
    name: 'T',
    tenantName: 'S',
    tenantSlug: `s-${ts}-${Math.floor(Math.random() * 1e6)}`,
  });
  const teacherToken = teacher.body.accessToken;

  const classRes = await request(app)
    .post('/api/v1/teacher/classes')
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({ name: 'A', code: `A${ts}` });

  const assignmentRes = await request(app)
    .post('/api/v1/teacher/assignments')
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({
      classId: classRes.body.id,
      title: 'Bot prietenos',
      description: 'Creează un bot',
    });
  const assignmentId = assignmentRes.body.id;

  // Mark assignment as LLM_TRAINING (DB directly — assignment route currently defaults to ML_TRAINING)
  await db.assignment.update({
    where: { id: assignmentId },
    data: { type: 'LLM_TRAINING' },
  });

  const studentCreate = await request(app)
    .post(`/api/v1/teacher/classes/${classRes.body.id}/students`)
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({ username: 'maria', password: 'parola123' });

  const studentLogin = await request(app).post('/api/v1/auth/student/login').send({
    classCode: classRes.body.code,
    username: studentCreate.body.username,
    password: studentCreate.body.password,
  });

  return {
    teacherToken,
    studentToken: studentLogin.body.accessToken,
    assignmentId,
    classId: classRes.body.id,
  };
}

describe('Teacher visibility', () => {
  it('teacher lists assignment LLM sessions', async () => {
    const { studentToken, teacherToken, assignmentId } = await setupFullStack();

    // Student creates 2 sessions, only one linked to assignment
    await request(app)
      .post('/api/v1/student/llm/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Personal', examples: [] });
    await request(app)
      .post('/api/v1/student/llm/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'AssignmentBot', assignmentId, examples: [] });

    const res = await request(app)
      .get(`/api/v1/teacher/llm/assignments/${assignmentId}/sessions`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.sessions).toHaveLength(1);
    expect(res.body.sessions[0].name).toBe('AssignmentBot');
  });

  it('teacher cannot see personal sessions (not linked to assignment)', async () => {
    const { studentToken, teacherToken, assignmentId } = await setupFullStack();

    // Personal session only
    const session = await request(app)
      .post('/api/v1/student/llm/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Personal', examples: [] });

    // Teacher tries to read it directly
    const res = await request(app)
      .get(`/api/v1/teacher/llm/sessions/${session.body.id}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(404);
  });

  it('teacher of another tenant cannot see sessions', async () => {
    const { studentToken, assignmentId } = await setupFullStack();

    // Student creates assignment-linked session
    await request(app)
      .post('/api/v1/student/llm/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'X', assignmentId, examples: [] });

    // Second teacher (different tenant)
    const ts = Date.now();
    const otherTeacher = await request(app).post('/api/v1/auth/teacher/signup').send({
      email: `o-${ts}@b.ro`,
      password: 'verysecret',
      name: 'Other',
      tenantName: 'OtherSchool',
      tenantSlug: `o-${ts}-${Math.floor(Math.random() * 1e6)}`,
    });
    const otherToken = otherTeacher.body.accessToken;

    const res = await request(app)
      .get(`/api/v1/teacher/llm/assignments/${assignmentId}/sessions`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});

describe('Reports', () => {
  it('student reports session → teacher sees in reports list', async () => {
    const { studentToken, teacherToken } = await setupFullStack();

    const session = await request(app)
      .post('/api/v1/student/llm/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Bot', examples: [] });

    await request(app)
      .post(`/api/v1/student/llm/sessions/${session.body.id}/report`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reason: 'A spus ceva ciudat' });

    const list = await request(app)
      .get('/api/v1/teacher/llm/reports')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(list.status).toBe(200);
    expect(list.body.reports).toHaveLength(1);
    expect(list.body.reports[0].reason).toBe('A spus ceva ciudat');
    expect(list.body.reports[0].reviewed).toBe(false);
  });

  it('teacher marks report reviewed', async () => {
    const { studentToken, teacherToken } = await setupFullStack();

    const session = await request(app)
      .post('/api/v1/student/llm/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Bot', examples: [] });
    await request(app)
      .post(`/api/v1/student/llm/sessions/${session.body.id}/report`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reason: 'X' });

    const list = await request(app)
      .get('/api/v1/teacher/llm/reports')
      .set('Authorization', `Bearer ${teacherToken}`);
    const reportId = list.body.reports[0].id;

    const patch = await request(app)
      .patch(`/api/v1/teacher/llm/reports/${reportId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ reviewed: true });
    expect(patch.status).toBe(204);

    const list2 = await request(app)
      .get('/api/v1/teacher/llm/reports')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(list2.body.reports[0].reviewed).toBe(true);
  });
});
