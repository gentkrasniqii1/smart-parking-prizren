import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/create-test-app.js';
import { resetRateLimits } from './utils/reset-rate-limits.js';
import { loginSeededAdmin, registerTestUser, deleteTestUser, TestUser } from './utils/test-users.js';
import { createFixtureSpot, deleteFixtureZone } from './utils/fixtures.js';
import { SpotsService } from '../src/modules/spots/spots.service.js';

describe('Sessions (e2e)', () => {
  let app: INestApplication;
  let admin: TestUser;
  let citizenA: TestUser;
  let citizenB: TestUser;
  let zoneId: string;
  let spotId: string;
  let otherSpotId: string;

  beforeAll(async () => {
    app = await createTestApp();
    // Shih auth.e2e-spec.ts: pastrim që në hyrje, çelësat e rate-limit janë
    // globalë te Redis dhe s'lidhen vetëm me këtë skedar.
    await resetRateLimits(app);
    admin = await loginSeededAdmin(app);
    citizenA = await registerTestUser(app, 'sessions-a');
    citizenB = await registerTestUser(app, 'sessions-b');

    const suffix = `${Date.now()}`;
    const fixture = await createFixtureSpot(app, admin.id, suffix);
    zoneId = fixture.zone.id;
    spotId = fixture.spot.id;

    // Spot i dytë NË TË NJËJTËN zonë (jo zonë e re) — kështu i vetmi
    // `deleteFixtureZone(zoneId)` te afterAll i pastron të dy (cascade).
    const spotsService = app.get(SpotsService);
    const otherSpot = await spotsService.create(
      {
        code: `E2E-${suffix}-2`,
        zoneId,
        location: { type: 'Point', coordinates: [20.7008, 42.2008] },
      },
      admin.id,
    );
    otherSpotId = otherSpot.id;
  });

  afterAll(async () => {
    // Kontroll defensiv: nëse beforeAll dështon në gjysmë (p.sh. gabim
    // rrjeti/DB), disa nga këto ndryshore mbeten `undefined` — s'duam që
    // afterAll të hedhë një gabim TË DYTË që fsheh shkakun real të parë.
    if (zoneId) {
      await deleteFixtureZone(app, zoneId);
    }
    if (citizenA) {
      await deleteTestUser(app, citizenA.id);
    }
    if (citizenB) {
      await deleteTestUser(app, citizenB.id);
    }
    await app.close();
  });

  it('POST /sessions/check-in succeeds on a free spot and flips it to occupied', async () => {
    const res = await request(app.getHttpServer())
      .post('/sessions/check-in')
      .set('Authorization', `Bearer ${citizenA.accessToken}`)
      .send({ spotId })
      .expect(201);

    expect(res.body.spotId).toBe(spotId);
    expect(res.body.checkOut).toBeNull();

    const spotRes = await request(app.getHttpServer()).get(`/spots/${spotId}`).expect(200);
    expect(spotRes.body.status).toBe('occupied');
  });

  it('POST /sessions/check-in rejects a second citizen on the same (now occupied) spot', async () => {
    await request(app.getHttpServer())
      .post('/sessions/check-in')
      .set('Authorization', `Bearer ${citizenB.accessToken}`)
      .send({ spotId })
      .expect(409);
  });

  it('GET /sessions/me/active returns the active session for citizen A', async () => {
    const res = await request(app.getHttpServer())
      .get('/sessions/me/active')
      .set('Authorization', `Bearer ${citizenA.accessToken}`)
      .expect(200);

    expect(res.body.session.spotId).toBe(spotId);
  });

  it('POST /sessions/check-in rejects a second spot for a citizen already parked elsewhere', async () => {
    await request(app.getHttpServer())
      .post('/sessions/check-in')
      .set('Authorization', `Bearer ${citizenA.accessToken}`)
      .send({ spotId: otherSpotId })
      .expect(409);
  });

  it('POST /sessions/check-out frees the spot', async () => {
    await request(app.getHttpServer())
      .post('/sessions/check-out')
      .set('Authorization', `Bearer ${citizenA.accessToken}`)
      .expect(200);

    const spotRes = await request(app.getHttpServer()).get(`/spots/${spotId}`).expect(200);
    expect(spotRes.body.status).toBe('free');
  });

  it('POST /sessions/check-out rejects when there is no active session', async () => {
    await request(app.getHttpServer())
      .post('/sessions/check-out')
      .set('Authorization', `Bearer ${citizenA.accessToken}`)
      .expect(404);
  });

  it("POST /sessions/check-in rejects when someone else's reservation is active right now", async () => {
    const startTime = new Date(Date.now() + 500).toISOString();
    const endTime = new Date(Date.now() + 5 * 60_000).toISOString();

    await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${citizenB.accessToken}`)
      .send({ spotId, startTime, endTime })
      .expect(201);

    // pret që rezervimi të bëhet "aktiv tani" (startTime <= now)
    await new Promise((resolve) => setTimeout(resolve, 700));

    await request(app.getHttpServer())
      .post('/sessions/check-in')
      .set('Authorization', `Bearer ${citizenA.accessToken}`)
      .send({ spotId })
      .expect(409);
  });
});
