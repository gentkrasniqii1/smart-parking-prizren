import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { SpotStatus } from '@prisma/client';
import request from 'supertest';
import { createTestApp } from './utils/create-test-app.js';
import { resetRateLimits } from './utils/reset-rate-limits.js';
import { loginSeededAdmin, registerTestUser, deleteTestUser, TestUser } from './utils/test-users.js';
import { createFixtureSpot, deleteFixtureZone } from './utils/fixtures.js';
import { SpotsService } from '../src/modules/spots/spots.service.js';

describe('Reservations (e2e)', () => {
  let app: INestApplication;
  let admin: TestUser;
  let citizenA: TestUser;
  let citizenB: TestUser;
  let zoneId: string;
  let spotId: string;
  let disabledSpotId: string;
  let reservationId: string;

  const HOUR = 60 * 60_000;

  function futureWindow(offsetMs: number, durationMs = HOUR) {
    const startTime = new Date(Date.now() + offsetMs).toISOString();
    const endTime = new Date(Date.now() + offsetMs + durationMs).toISOString();
    return { startTime, endTime };
  }

  beforeAll(async () => {
    app = await createTestApp();
    await resetRateLimits(app);
    admin = await loginSeededAdmin(app);
    citizenA = await registerTestUser(app, 'reservations-a');
    citizenB = await registerTestUser(app, 'reservations-b');

    const suffix = `${Date.now()}`;
    const fixture = await createFixtureSpot(app, admin.id, suffix);
    zoneId = fixture.zone.id;
    spotId = fixture.spot.id;

    const spotsService = app.get(SpotsService);
    const disabledSpot = await spotsService.create(
      {
        code: `E2E-${suffix}-disabled`,
        zoneId,
        location: { type: 'Point', coordinates: [20.7009, 42.2009] },
        status: SpotStatus.disabled,
      },
      admin.id,
    );
    disabledSpotId = disabledSpot.id;
  });

  afterAll(async () => {
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

  it('POST /reservations rejects endTime <= startTime', async () => {
    const { startTime, endTime } = futureWindow(HOUR);

    await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${citizenA.accessToken}`)
      .send({ spotId, startTime: endTime, endTime: startTime })
      .expect(400);
  });

  it('POST /reservations rejects a startTime in the past', async () => {
    const startTime = new Date(Date.now() - HOUR).toISOString();
    const endTime = new Date(Date.now() + HOUR).toISOString();

    await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${citizenA.accessToken}`)
      .send({ spotId, startTime, endTime })
      .expect(400);
  });

  it('POST /reservations rejects a disabled spot', async () => {
    const { startTime, endTime } = futureWindow(HOUR);

    await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${citizenA.accessToken}`)
      .send({ spotId: disabledSpotId, startTime, endTime })
      .expect(409);
  });

  it('POST /reservations creates a confirmed reservation', async () => {
    const { startTime, endTime } = futureWindow(HOUR);

    const res = await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${citizenA.accessToken}`)
      .send({ spotId, startTime, endTime })
      .expect(201);

    expect(res.body.status).toBe('confirmed');
    expect(res.body.spotId).toBe(spotId);
    reservationId = res.body.id;
  });

  it('POST /reservations rejects an overlapping window on the same spot', async () => {
    const { startTime, endTime } = futureWindow(HOUR + 30 * 60_000);

    await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${citizenB.accessToken}`)
      .send({ spotId, startTime, endTime })
      .expect(409);
  });

  it('GET /reservations/me lists the reservation for its owner', async () => {
    const res = await request(app.getHttpServer())
      .get('/reservations/me')
      .set('Authorization', `Bearer ${citizenA.accessToken}`)
      .expect(200);

    expect(res.body.some((r: { id: string }) => r.id === reservationId)).toBe(true);
  });

  it('POST /reservations/:id/cancel rejects a non-owner', async () => {
    await request(app.getHttpServer())
      .post(`/reservations/${reservationId}/cancel`)
      .set('Authorization', `Bearer ${citizenB.accessToken}`)
      .expect(403);
  });

  it('POST /reservations/:id/cancel cancels the reservation for its owner', async () => {
    const res = await request(app.getHttpServer())
      .post(`/reservations/${reservationId}/cancel`)
      .set('Authorization', `Bearer ${citizenA.accessToken}`)
      .expect(200);

    expect(res.body.status).toBe('cancelled');
  });

  it('POST /reservations/:id/cancel is idempotent once already cancelled', async () => {
    const res = await request(app.getHttpServer())
      .post(`/reservations/${reservationId}/cancel`)
      .set('Authorization', `Bearer ${citizenA.accessToken}`)
      .expect(200);

    expect(res.body.status).toBe('cancelled');
  });

  it('GET /reservations/spot/:spotId/upcoming (public) excludes cancelled reservations', async () => {
    const res = await request(app.getHttpServer())
      .get(`/reservations/spot/${spotId}/upcoming`)
      .expect(200);

    expect(res.body.some((r: { id: string }) => r.id === reservationId)).toBe(false);
  });

  it('POST /reservations allows re-booking the same slot after cancellation', async () => {
    const { startTime, endTime } = futureWindow(HOUR);

    await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${citizenB.accessToken}`)
      .send({ spotId, startTime, endTime })
      .expect(201);
  });
});
