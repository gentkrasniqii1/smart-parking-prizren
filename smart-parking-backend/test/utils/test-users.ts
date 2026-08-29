import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service.js';

export interface TestUser {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

// Email unik (timestamp+random) — shmang përplasjet 409 mes ekzekutimeve të
// njëpasnjëshme të suite-s, pa kërkuar pastrim paraprak të DB-së.
export async function registerTestUser(
  app: INestApplication,
  prefix: string,
): Promise<TestUser> {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password: 'Passw0rd123' })
    .expect(201);

  return {
    id: res.body.user.id,
    email,
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
  };
}

// I vetmi admin i disponueshëm është ai i mbjellë nga `prisma/seed.js` — s'ka
// mënyrë tjetër ta krijojmë via API publike (register gjithmonë jep citizen).
export async function loginSeededAdmin(app: INestApplication): Promise<TestUser> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'admin@smartparking.rks', password: 'AdminPrizren2026!' })
    .expect(200);

  return {
    id: res.body.user.id,
    email: res.body.user.email,
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
  };
}

export async function deleteTestUser(app: INestApplication, userId: string): Promise<void> {
  const prisma = app.get(PrismaService);
  await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
}
