import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import { createApp } from '../../src/app.js';
import { db } from '../../src/lib/db.js';

// UPLOAD_DIR is set in globalSetup.ts
const app = createApp();

beforeEach(async () => {
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
  const teacherSignup = await request(app).post('/api/v1/auth/teacher/signup').send({
    email: `t-${ts}-${Math.random()}@b.ro`,
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

  await request(app)
    .post(`/api/v1/teacher/classes/${klass.body.id}/students`)
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({ username: 'ana', password: 'parola1', displayName: 'Ana' });

  const studentLogin = await request(app)
    .post('/api/v1/auth/student/login')
    .send({ classCode: klass.body.code, username: 'ana', password: 'parola1' });
  const studentToken = studentLogin.body.accessToken as string;

  // Create project + label via sync
  const project = await request(app)
    .post('/api/v1/student/ml/projects')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({
      clientId: 'p1',
      name: 'My Proj',
      labels: [{ clientId: 'lab1', name: 'cats', imageCount: 0 }],
    });

  return {
    teacherToken,
    studentToken,
    projectId: project.body.id as string,
    labelId: project.body.labels[0].id as string,
  };
}

async function makeJpegBuffer(): Promise<Buffer> {
  return await sharp({
    create: { width: 100, height: 80, channels: 3, background: { r: 200, g: 100, b: 50 } },
  })
    .jpeg()
    .toBuffer();
}

describe('Images', () => {
  it('rejects upload without auth', async () => {
    const res = await request(app)
      .post('/api/v1/student/ml/projects/x/labels/y/images')
      .field('clientId', 'i1')
      .attach('image', await makeJpegBuffer(), 'test.jpg');
    expect(res.status).toBe(401);
  });

  it('student uploads image, server resizes + stores', async () => {
    const ctx = await setup();
    const res = await request(app)
      .post(`/api/v1/student/ml/projects/${ctx.projectId}/labels/${ctx.labelId}/images`)
      .set('Authorization', `Bearer ${ctx.studentToken}`)
      .field('clientId', 'img-1')
      .attach('image', await makeJpegBuffer(), 'photo.jpg');
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.sizeBytes).toBeGreaterThan(0);
    expect(res.body.width).toBe(100);
    expect(res.body.height).toBe(80);
  });

  it('upload is idempotent on clientId', async () => {
    const ctx = await setup();
    const a = await request(app)
      .post(`/api/v1/student/ml/projects/${ctx.projectId}/labels/${ctx.labelId}/images`)
      .set('Authorization', `Bearer ${ctx.studentToken}`)
      .field('clientId', 'img-1')
      .attach('image', await makeJpegBuffer(), 'photo.jpg');
    const b = await request(app)
      .post(`/api/v1/student/ml/projects/${ctx.projectId}/labels/${ctx.labelId}/images`)
      .set('Authorization', `Bearer ${ctx.studentToken}`)
      .field('clientId', 'img-1')
      .attach('image', await makeJpegBuffer(), 'photo.jpg');
    expect(b.body.id).toBe(a.body.id);
  });

  it('teacher can serve image of student in their class', async () => {
    const ctx = await setup();
    const upload = await request(app)
      .post(`/api/v1/student/ml/projects/${ctx.projectId}/labels/${ctx.labelId}/images`)
      .set('Authorization', `Bearer ${ctx.studentToken}`)
      .field('clientId', 'img-1')
      .attach('image', await makeJpegBuffer(), 'photo.jpg');

    const res = await request(app)
      .get(`/api/v1/ml/images/${upload.body.id}`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/jpeg/);
    expect(res.body.length).toBeGreaterThan(100);
  });

  it('teacher from another tenant cannot serve image', async () => {
    const ctxA = await setup();
    const upload = await request(app)
      .post(`/api/v1/student/ml/projects/${ctxA.projectId}/labels/${ctxA.labelId}/images`)
      .set('Authorization', `Bearer ${ctxA.studentToken}`)
      .field('clientId', 'img-1')
      .attach('image', await makeJpegBuffer(), 'photo.jpg');

    const ctxB = await setup();
    const res = await request(app)
      .get(`/api/v1/ml/images/${upload.body.id}`)
      .set('Authorization', `Bearer ${ctxB.teacherToken}`);
    expect([403, 404]).toContain(res.status);
  });

  it('student deletes own image', async () => {
    const ctx = await setup();
    const upload = await request(app)
      .post(`/api/v1/student/ml/projects/${ctx.projectId}/labels/${ctx.labelId}/images`)
      .set('Authorization', `Bearer ${ctx.studentToken}`)
      .field('clientId', 'img-1')
      .attach('image', await makeJpegBuffer(), 'photo.jpg');

    const del = await request(app)
      .delete(`/api/v1/student/ml/images/${upload.body.id}`)
      .set('Authorization', `Bearer ${ctx.studentToken}`);
    expect(del.status).toBe(204);

    const get = await request(app)
      .get(`/api/v1/ml/images/${upload.body.id}`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`);
    expect(get.status).toBe(404);
  });

  it('rejects upload without clientId', async () => {
    const ctx = await setup();
    const res = await request(app)
      .post(`/api/v1/student/ml/projects/${ctx.projectId}/labels/${ctx.labelId}/images`)
      .set('Authorization', `Bearer ${ctx.studentToken}`)
      .attach('image', await makeJpegBuffer(), 'photo.jpg');
    expect(res.status).toBe(400);
  });

  it('rejects upload with no file', async () => {
    const ctx = await setup();
    const res = await request(app)
      .post(`/api/v1/student/ml/projects/${ctx.projectId}/labels/${ctx.labelId}/images`)
      .set('Authorization', `Bearer ${ctx.studentToken}`)
      .field('clientId', 'img-1');
    expect(res.status).toBe(400);
  });

  it('deleting project removes image files from disk', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const ctx = await setup();
    const upload = await request(app)
      .post(`/api/v1/student/ml/projects/${ctx.projectId}/labels/${ctx.labelId}/images`)
      .set('Authorization', `Bearer ${ctx.studentToken}`)
      .field('clientId', 'img-cleanup')
      .attach('image', await makeJpegBuffer(), 'photo.jpg');

    const filename = (upload.body as { filename: string }).filename;
    const fullPath = path.join(process.env.UPLOAD_DIR!, filename);

    await fs.access(fullPath); // exists pre-delete

    await request(app)
      .delete(`/api/v1/student/ml/projects/${ctx.projectId}`)
      .set('Authorization', `Bearer ${ctx.studentToken}`)
      .expect(204);

    let stillExists = true;
    try { await fs.access(fullPath); } catch { stillExists = false; }
    expect(stillExists).toBe(false);
  });
});

describe('Teacher stats', () => {
  it('returns aggregated counts', async () => {
    const ts = Date.now();
    const teacher = await request(app).post('/api/v1/auth/teacher/signup').send({
      email: `stats-${ts}-${Math.random()}@b.ro`,
      password: 'verysecret',
      name: 'T',
      tenantName: 'School',
      tenantSlug: `stats-${ts}-${Math.floor(Math.random() * 1e6)}`,
    });
    const tt = teacher.body.accessToken as string;

    const klass = await request(app)
      .post('/api/v1/teacher/classes')
      .set('Authorization', `Bearer ${tt}`)
      .send({ name: 'C1' });
    await request(app)
      .post(`/api/v1/teacher/classes/${klass.body.id}/students`)
      .set('Authorization', `Bearer ${tt}`)
      .send({ username: 'st1', password: 'parola1' });

    const stats = await request(app)
      .get('/api/v1/teacher/stats')
      .set('Authorization', `Bearer ${tt}`);
    expect(stats.status).toBe(200);
    expect(stats.body.classCount).toBe(1);
    expect(stats.body.studentCount).toBe(1);
    expect(stats.body.projectCount).toBe(0);
    expect(stats.body.imagesLast24h).toBe(0);
  });
});
