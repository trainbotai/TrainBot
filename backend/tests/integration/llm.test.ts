import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { db } from '../../src/lib/db.js';

// Mock LLM provider so tests don't call Groq
vi.mock('../../src/modules/llm/providers/groq.js', () => ({
  GroqProvider: vi.fn().mockImplementation(() => ({
    name: 'groq',
    chat: vi.fn().mockResolvedValue({
      content: 'Salut prieten!',
      inputTokens: 100,
      outputTokens: 20,
      latencyMs: 500,
    }),
  })),
}));

// Mock OpenAI Moderation as always-safe
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

async function setupTeacherAndStudent() {
  const ts = Date.now();
  const teacher = await request(app).post('/api/v1/auth/teacher/signup').send({
    email: `t-${ts}@b.ro`,
    password: 'verysecret',
    name: 'Teacher',
    tenantName: 'School',
    tenantSlug: `school-${ts}-${Math.floor(Math.random() * 1e6)}`,
  });
  const teacherToken = teacher.body.accessToken as string;

  const classRes = await request(app)
    .post('/api/v1/teacher/classes')
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({ name: 'Clasa A', code: `A${ts}` });
  const classId = classRes.body.id as string;
  const classCode = classRes.body.code as string;

  const studentCreate = await request(app)
    .post(`/api/v1/teacher/classes/${classId}/students`)
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({ username: 'maria', password: 'parola123' });
  const username = studentCreate.body.username as string;
  const password = 'parola123';

  const studentLogin = await request(app).post('/api/v1/auth/student/login').send({
    classCode,
    username,
    password,
  });

  return {
    teacherToken,
    studentToken: studentLogin.body.accessToken as string,
    classId,
  };
}

describe('LLM session CRUD', () => {
  it('creates session with examples → version 1', async () => {
    const { studentToken } = await setupTeacherAndStudent();

    const res = await request(app)
      .post('/api/v1/student/llm/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Robotul prietenos',
        examples: [
          { user: 'Salut', ai: 'Salut prieten!' },
          { user: 'Ce mai faci?', ai: 'Bine, mulțumesc!' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Robotul prietenos');
    expect(res.body.versions).toHaveLength(1);
    expect(res.body.versions[0].versionNumber).toBe(1);
    expect(res.body.versions[0].examples).toHaveLength(2);
  });

  it('lists my sessions', async () => {
    const { studentToken } = await setupTeacherAndStudent();

    await request(app)
      .post('/api/v1/student/llm/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Bot 1', examples: [] });
    await request(app)
      .post('/api/v1/student/llm/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Bot 2', examples: [] });

    const res = await request(app)
      .get('/api/v1/student/llm/sessions')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.sessions).toHaveLength(2);
  });

  it('adds new version to existing session', async () => {
    const { studentToken } = await setupTeacherAndStudent();

    const created = await request(app)
      .post('/api/v1/student/llm/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Bot', examples: [{ user: 'A', ai: 'B' }] });

    const sessionId = created.body.id as string;

    const newVersion = await request(app)
      .post(`/api/v1/student/llm/sessions/${sessionId}/versions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ examples: [{ user: 'A', ai: 'B' }, { user: 'C', ai: 'D' }] });

    expect(newVersion.status).toBe(201);
    expect(newVersion.body.versions).toHaveLength(2);
    expect(newVersion.body.versions[1].versionNumber).toBe(2);
  });

  it('soft deletes session', async () => {
    const { studentToken } = await setupTeacherAndStudent();

    const created = await request(app)
      .post('/api/v1/student/llm/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Bot', examples: [] });
    const sessionId = created.body.id;

    const del = await request(app)
      .delete(`/api/v1/student/llm/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(del.status).toBe(204);

    const list = await request(app)
      .get('/api/v1/student/llm/sessions')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(list.body.sessions).toHaveLength(0);

    const detail = await request(app)
      .get(`/api/v1/student/llm/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(detail.status).toBe(404);
  });

  it('rejects more than max examples per version', async () => {
    const { studentToken } = await setupTeacherAndStudent();

    const tooMany = Array.from({ length: 11 }, (_, i) => ({
      user: `q${i}`,
      ai: `a${i}`,
    }));

    const res = await request(app)
      .post('/api/v1/student/llm/sessions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Bot', examples: tooMany });
    expect(res.status).toBe(400);
  });

  it('returns quota info', async () => {
    const { studentToken } = await setupTeacherAndStudent();

    const res = await request(app)
      .get('/api/v1/student/llm/quota')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(50);
    expect(res.body.used).toBe(0);
    expect(res.body.remaining).toBe(50);
  });
});
