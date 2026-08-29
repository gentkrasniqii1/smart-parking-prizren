import type { INestApplication } from '@nestjs/common';
import { SpotStatus } from '@prisma/client';
import { ZonesService, ZoneWithGeometry } from '../../src/modules/zones/zones.service.js';
import { SpotsService, SpotWithGeometry } from '../../src/modules/spots/spots.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

// Përdor ZonesService/SpotsService (jo SQL të përsëritur) — kështu fixtures
// përdorin saktësisht të njëjtin path si prodhimi (ST_GeomFromGeoJSON etj.).
// Kërkon një `actorId` real (FK e vërtetë te User) — jo vlerë e trilluar.
export async function createFixtureSpot(
  app: INestApplication,
  adminId: string,
  suffix: string,
  status: SpotStatus = SpotStatus.free,
): Promise<{ zone: ZoneWithGeometry; spot: SpotWithGeometry }> {
  const zonesService = app.get(ZonesService);
  const spotsService = app.get(SpotsService);

  const zone = await zonesService.create(
    {
      name: `E2E Zone ${suffix}`,
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [20.7, 42.2],
            [20.701, 42.2],
            [20.701, 42.201],
            [20.7, 42.201],
            [20.7, 42.2],
          ],
        ],
      },
    },
    adminId,
  );

  const spot = await spotsService.create(
    {
      code: `E2E-${suffix}`,
      zoneId: zone.id,
      location: { type: 'Point', coordinates: [20.7005, 42.2005] },
      status,
    },
    adminId,
  );

  return { zone, spot };
}

// Fshirja e zonës kaskadon (onDelete: Cascade) te spotet, sesionet,
// rezervimet dhe sensor-events që i përkasin — pastrim i mjaftueshëm.
export async function deleteFixtureZone(app: INestApplication, zoneId: string): Promise<void> {
  const prisma = app.get(PrismaService);
  await prisma.$executeRaw`DELETE FROM parking_zones WHERE id = ${zoneId}`;
}
