import type { INestApplication } from '@nestjs/common';
import { RedisService } from '../../src/redis/redis.service.js';

// I njëjti Redis dev që përdor `npm run start:dev` — s'ka Redis i veçantë për
// teste. Pa këtë pastrim, çelësat "ratelimit:*" të mbetur nga testimi manual
// (curl/browser) i sesioneve të mëparshme, ose nga teste të tjera brenda të
// njëjtës dritare kohore (60s), do ta bënin testin e rate-limit jo-deterministik.
export async function resetRateLimits(app: INestApplication): Promise<void> {
  const redis = app.get(RedisService);
  const keys = await redis.publisher.keys('ratelimit:*');
  if (keys.length > 0) {
    await redis.publisher.del(...keys);
  }
}
