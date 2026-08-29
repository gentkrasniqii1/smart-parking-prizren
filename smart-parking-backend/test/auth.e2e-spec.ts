import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/create-test-app.js';
import { resetRateLimits } from './utils/reset-rate-limits.js';
import { deleteTestUser } from './utils/test-users.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let email: string;
  let userId: string;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    // Pastrim që në hyrje — çelësat "ratelimit:*" te Redis janë globalë (jo
    // të lidhur me këtë skedar), kështu që teste të mëparshme (këtë skedar
    // ose skedarë të tjerë e2e, ose testim manual curl/browser i mëhershëm)
    // brenda së njëjtës dritare 60s do ta bënin numërimin jo-deterministik.
    await resetRateLimits(app);
    email = `auth-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  });

  afterAll(async () => {
    if (userId) {
      await deleteTestUser(app, userId);
    }
    await app.close();
  });

  it('POST /auth/register rejects a password shorter than 8 characters', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'short-pw@example.com', password: '1234567' })
      .expect(400);
  });

  it('POST /auth/register rejects unknown fields (whitelist validation)', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'extra-field@example.com', password: 'Passw0rd123', role: 'admin' })
      .expect(400);
  });

  it('POST /auth/register creates a citizen and returns tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Passw0rd123' })
      .expect(201);

    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe('citizen');
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));

    userId = res.body.user.id;
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('POST /auth/register rejects a duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Passw0rd123' })
      .expect(409);
  });

  it('POST /auth/login rejects a nonexistent email', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nobody-here@example.com', password: 'whatever123' })
      .expect(401);
  });

  it('POST /auth/login rejects the wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);
  });

  it('POST /auth/login succeeds with correct credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Passw0rd123' })
      .expect(200);

    expect(res.body.user.email).toBe(email);
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('GET /auth/me rejects a request without a token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('GET /auth/me returns the authenticated user', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.email).toBe(email);
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('POST /auth/refresh rotates the token pair', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).not.toBe(refreshToken);
    refreshToken = res.body.refreshToken;
    accessToken = res.body.accessToken;
  });

  it('POST /auth/logout revokes the refresh token', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(401);
  });

  describe('rate limiting on /auth/login', () => {
    beforeAll(async () => {
      // Pastrim eksplicit para testit dedikuar — përndryshe kërkesat e
      // mëparshme (regjistrim/login më sipër, ose testim curl/browser i
      // mëhershëm brenda së njëjtës dritare 60s) do ta bënin numërimin
      // jo-parashikueshëm.
      await resetRateLimits(app);
    });

    it('allows up to the configured limit, then returns 429', async () => {
      const attempts = 6; // limiti është 5/60s te /auth/login
      const statuses: number[] = [];

      for (let i = 0; i < attempts; i++) {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email, password: 'wrong-on-purpose' });
        statuses.push(res.status);
      }

      expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
      expect(statuses[5]).toBe(429);
    });

    afterAll(async () => {
      // S'e lëmë dritaren "të helmuar" për teste të tjera (këtë proces ose
      // një skedar tjetër e2e) që duan të bëjnë login normalisht pas kësaj.
      await resetRateLimits(app);
    });
  });
});
