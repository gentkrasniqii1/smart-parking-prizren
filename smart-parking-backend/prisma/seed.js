import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@smartparking.rks';
const ADMIN_PASSWORD = 'AdminPrizren2026!';

const zones = [
  {
    name: 'Sheshi Shatërvan',
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [20.7393, 42.2133],
          [20.7407, 42.2133],
          [20.7407, 42.2143],
          [20.7393, 42.2143],
          [20.7393, 42.2133],
        ],
      ],
    },
    spots: [
      { code: 'A-01', status: 'free', coordinates: [20.7396, 42.2135] },
      { code: 'A-02', status: 'occupied', coordinates: [20.7399, 42.2136] },
      { code: 'A-03', status: 'free', coordinates: [20.7402, 42.2137] },
      { code: 'A-04', status: 'reserved', coordinates: [20.7404, 42.2139] },
      { code: 'A-05', status: 'disabled', coordinates: [20.7398, 42.214] },
    ],
  },
  {
    name: 'Lagjja Kurillë',
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [20.7418, 42.2108],
          [20.7434, 42.2108],
          [20.7434, 42.212],
          [20.7418, 42.212],
          [20.7418, 42.2108],
        ],
      ],
    },
    spots: [
      { code: 'B-01', status: 'free', coordinates: [20.742, 42.211] },
      { code: 'B-02', status: 'free', coordinates: [20.7424, 42.2112] },
      { code: 'B-03', status: 'occupied', coordinates: [20.7428, 42.2114] },
      { code: 'B-04', status: 'free', coordinates: [20.7431, 42.2117] },
    ],
  },
];

async function main() {
  console.log('Duke pastruar të dhënat ekzistuese të zonave/spoteve...');
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE parking_spots, parking_zones RESTART IDENTITY CASCADE',
  );

  console.log(`Duke krijuar përdoruesin admin (${ADMIN_EMAIL})...`);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, role: 'admin' },
    create: { email: ADMIN_EMAIL, passwordHash, role: 'admin' },
  });

  for (const zone of zones) {
    console.log(`Duke krijuar zonën "${zone.name}"...`);
    const [{ id: zoneId }] = await prisma.$queryRawUnsafe(
      `INSERT INTO parking_zones (id, name, polygon, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326), now(), now())
       RETURNING id`,
      zone.name,
      JSON.stringify(zone.polygon),
    );

    for (const spot of zone.spots) {
      const point = { type: 'Point', coordinates: spot.coordinates };
      await prisma.$executeRawUnsafe(
        `INSERT INTO parking_spots (id, code, location, status, "zoneId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326), $3::"SpotStatus", $4, now(), now())`,
        spot.code,
        JSON.stringify(point),
        spot.status,
        zoneId,
      );
    }
  }

  console.log('Seed u përfundua.');
  console.log(
    `Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} (vetëm për zhvillim lokal)`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
