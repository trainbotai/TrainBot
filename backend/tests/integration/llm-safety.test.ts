import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { db } from '../../src/lib/db.js';

const mockChat = vi.fn();
vi.mock('../../src/modules/llm/providers/groq.js', () => ({
  GroqProvider: vi.fn().mockImplementation(() => ({
    name: 'groq',
    chat: mockChat,
  })),
}));

const mockModeration = vi.fn();
vi.mock('../../src/modules/llm/safety/moderation.js', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/modules/llm/safety/moderation.js')
  >('../../src/modules/llm/safety/moderation.js');
  return { ...actual, checkModeration: mockModeration };
});

const app = createApp();

beforeEach(async () => {
  mockChat.mockReset();
  mockModeration.mockReset();

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

async function setupAndCreateSession() {
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
  const classCode = classRes.body.code;

  const studentCreate = await request(app)
    .post(`/api/v1/teacher/classes/${classRes.body.id}/students`)
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({ username: 'maria', password: 'parola123' });

  const studentLogin = await request(app).post('/api/v1/auth/student/login').send({
    classCode,
    username: studentCreate.body.username,
    password: studentCreate.body.password,
  });
  const studentToken = studentLogin.body.accessToken;

  const session = await request(app)
    .post('/api/v1/student/llm/sessions')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ name: 'Bot', examples: [{ user: 'salut', ai: 'salut prieten' }] });

  return { studentToken, sessionId: session.body.id };
}

describe('LLM query flow + safety', () => {
  it('successful query returns SSE faked stream', async () => {
    const { studentToken, sessionId } = await setupAndCreateSession();
    mockModeration.mockResolvedValue({ safe: true });
    mockChat.mockResolvedValueOnce({
      content: 'Salut prieten drag!',
      inputTokens: 100,
      outputTokens: 20,
      latencyMs: 500,
    });

    const res = await request(app)
      .post(`/api/v1/student/llm/sessions/${sessionId}/query`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ prompt: 'Salut!' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    expect(res.text).toContain('data:');
    expect(res.text).toContain('"done":true');
    expect(res.text).toContain('"outputTokens":20');
  });

  it('blocks input on keyword filter (te omor)', async () => {
    const { studentToken, sessionId } = await setupAndCreateSession();

    const res = await request(app)
      .post(`/api/v1/student/llm/sessions/${sessionId}/query`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ prompt: 'te omor!' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('llm/content_blocked_input');
    expect(mockChat).not.toHaveBeenCalled();

    // Verify audit logged
    const queries = await db.lLMQuery.findMany();
    expect(queries).toHaveLength(1);
    expect(queries[0].inputModerationFlagged).toBe(true);
  });

  it('blocks input on Moderation API', async () => {
    const { studentToken, sessionId } = await setupAndCreateSession();
    mockModeration.mockResolvedValueOnce({
      safe: false,
      categories: { 'sexual/minors': 0.2 },
    });

    const res = await request(app)
      .post(`/api/v1/student/llm/sessions/${sessionId}/query`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ prompt: 'something subtle' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('llm/content_blocked_input');
    expect(mockChat).not.toHaveBeenCalled();
  });

  it('blocks output on Moderation', async () => {
    const { studentToken, sessionId } = await setupAndCreateSession();
    mockModeration
      .mockResolvedValueOnce({ safe: true }) // input safe
      .mockResolvedValueOnce({ safe: false, categories: { violence: 0.9 } }); // output blocked

    mockChat.mockResolvedValueOnce({
      content: 'Bad violent output from LLM',
      inputTokens: 100,
      outputTokens: 30,
      latencyMs: 500,
    });

    const res = await request(app)
      .post(`/api/v1/student/llm/sessions/${sessionId}/query`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ prompt: 'innocent prompt' });

    expect(res.status).toBe(502);
    expect(res.body.code).toBe('llm/content_blocked_output');

    const queries = await db.lLMQuery.findMany();
    expect(queries).toHaveLength(1);
    expect(queries[0].outputModerationFlagged).toBe(true);
    expect(queries[0].aiResponse).toBe('Bad violent output from LLM');
  });

  it('enforces quota after 50 queries', async () => {
    const { studentToken, sessionId } = await setupAndCreateSession();
    mockModeration.mockResolvedValue({ safe: true });
    mockChat.mockResolvedValue({
      content: 'ok',
      inputTokens: 10,
      outputTokens: 5,
      latencyMs: 100,
    });

    // Simulate 50 queries already saved
    const sessions = await db.lLMSession.findFirst({
      include: { versions: { take: 1 } },
    });
    const studentId = sessions!.studentId;
    const versionId = sessions!.versions[0]!.id;

    for (let i = 0; i < 50; i++) {
      await db.lLMQuery.create({
        data: {
          sessionId,
          versionId,
          studentId,
          userPrompt: `q${i}`,
          aiResponse: `a${i}`,
        },
      });
    }

    const res = await request(app)
      .post(`/api/v1/student/llm/sessions/${sessionId}/query`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ prompt: 'one more' });

    expect(res.status).toBe(429);
    expect(res.body.code).toBe('llm/quota_exceeded');
  });

  it('returns 503 on provider failure', async () => {
    const { studentToken, sessionId } = await setupAndCreateSession();
    mockModeration.mockResolvedValue({ safe: true });
    mockChat.mockRejectedValueOnce(new Error('Provider boom'));

    const res = await request(app)
      .post(`/api/v1/student/llm/sessions/${sessionId}/query`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ prompt: 'salut' });

    expect(res.status).toBe(503);
    expect(res.body.code).toBe('llm/groq_unavailable');
  });
});
