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
  // Njësoj si më sipër, POR string bosh, JO delete: dotenv (brenda
  // ConfigModule.forRoot, ekzekutuar kur AppModule kompilohet më poshtë)
  // s'i mbishkruan variablat EKZISTUESE — nëse e fshijmë (delete) në vend që
  // ta vendosim, dotenv e rimbush menjëherë me vlerën reale nga .env dhe
  // fix-i s'bën asgjë. register-i (auth/reservations/sessions.e2e-spec)
  // krijon user-a reale dhe do të thërriste Resend-in e vërtetë me email-e
  // testimi @example.com — Resend i refuzon (422) dhe s'thyen asgjë
  // (EmailService s'hedh gabim), por harxhon kuota/log kot.
  process.env.RESEND_API_KEY = '';

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
