import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { db } from '../../src/lib/db.js';

const app = createApp();

beforeEach(async () => {
  await db.pilotRequest.deleteMany();
});

describe('POST /api/v1/pilot-request', () => {
  it('creates a pilot request without auth', async () => {
    const res = await request(app).post('/api/v1/pilot-request').send({
      name: 'Prof. Ionescu',
      school: 'Școala Gimnazială Nr. 1',
      email: 'ionescu@scoala1.ro',
      message: 'Vrem pilot pentru clasa a VI-a.',
      locale: 'ro',
    });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });

    const rows = await db.pilotRequest.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.email).toBe('ionescu@scoala1.ro');
    expect(rows[0]!.school).toBe('Școala Gimnazială Nr. 1');
  });

  it('rejects invalid email with 400', async () => {
    const res = await request(app).post('/api/v1/pilot-request').send({
      name: 'X',
      school: 'Y',
      email: 'not-an-email',
    });
    expect(res.status).toBe(400);
    expect(await db.pilotRequest.count()).toBe(0);
  });

  it('rejects missing required fields with 400', async () => {
    const res = await request(app).post('/api/v1/pilot-request').send({
      email: 'a@b.ro',
    });
    expect(res.status).toBe(400);
  });

  it('silently drops honeypot submissions (bot) but still returns 201', async () => {
    const res = await request(app).post('/api/v1/pilot-request').send({
      name: 'Bot',
      school: 'Spam Inc',
      email: 'spam@bot.com',
      website: 'https://spam.example.com',
    });
    expect(res.status).toBe(201);
    expect(await db.pilotRequest.count()).toBe(0);
  });
});
