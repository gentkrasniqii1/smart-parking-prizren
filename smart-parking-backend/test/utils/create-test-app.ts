import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module.js';

// Testet e2e nisin gjithë AppModule (të njëjtin që përdor main.ts), prandaj
// duhet të riprodhojmë saktësisht pipe-in global të main.ts — përndryshe
// validimi i DTO-ve (whitelist/400) s'do të testohej fare.
//
// Çaktivizon sensor-simulator-in PARA se moduli të kompilohet: dotenv (nga
// ConfigModule.forRoot) s'i mbishkruan variablat e mjedisit ekzistuese, kështu
// që kjo mbetet efektive edhe pse .env ka SENSOR_SIMULATOR_ENABLED=true —
// pa këtë, tick-et e simulatorit çdo 8s do të ndryshonin rastësisht statuset
// e spoteve gjatë testeve dhe do t'i bënin jo-deterministike (race me fixtures).
export async function createTestApp(): Promise<INestApplication> {
  process.env.SENSOR_SIMULATOR_ENABLED = 'false';

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}
