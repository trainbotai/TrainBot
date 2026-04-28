import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { db } from '../../src/lib/db.js';

const app = createApp();

async function makeTeacher() {
  const res = await request(app).post('/api/v1/auth/teacher/signup').send({
    email: `t-${Date.now()}-${Math.random()}@b.ro`,
    password: 'verysecret',
    name: 'T',
    tenantName: 'School',
    tenantSlug: `school-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
  });
  return res.body.accessToken as string;
}

beforeEach(async () => {
  await db.refreshToken.deleteMany();
  await db.student.deleteMany();
  await db.class.deleteMany();
  await db.teacher.deleteMany();
  await db.tenant.deleteMany();
});

describe('Classes', () => {
  it('GET /classes without auth returns 401', async () => {
    const res = await request(app).get('/api/v1/teacher/classes');
    expect(res.status).toBe(401);
  });

  it('POST + GET roundtrip', async () => {
    const token = await makeTeacher();
    const create = await request(app)
      .post('/api/v1/teacher/classes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Class', description: 'desc' });
    expect(create.status).toBe(201);
    expect(create.body.code).toMatch(/^[A-Z0-9]{2}-[A-Z0-9]{4}$/);

    const list = await request(app)
      .get('/api/v1/teacher/classes')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].name).toBe('My Class');
  });

  it('PATCH updates class', async () => {
    const token = await makeTeacher();
    const c = await request(app)
      .post('/api/v1/teacher/classes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Original' });
    const patched = await request(app)
      .patch(`/api/v1/teacher/classes/${c.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated' });
    expect(patched.status).toBe(200);
    expect(patched.body.name).toBe('Updated');
  });

  it('DELETE archives class (no longer in list)', async () => {
    const token = await makeTeacher();
    const c = await request(app)
      .post('/api/v1/teacher/classes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Archive' });
    const del = await request(app)
      .delete(`/api/v1/teacher/classes/${c.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    const list = await request(app)
      .get('/api/v1/teacher/classes')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.data).toHaveLength(0);
  });

  it('teacher cannot see another teachers classes (multi-tenant isolation)', async () => {
    const tokenA = await makeTeacher();
    await request(app)
      .post('/api/v1/teacher/classes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'A class' });

    const tokenB = await makeTeacher();
    const list = await request(app)
      .get('/api/v1/teacher/classes')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(list.body.data).toHaveLength(0);
  });
});
