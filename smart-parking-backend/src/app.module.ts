import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { PassportGlobalModule } from './common/passport-global.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ZonesModule } from './modules/zones/zones.module.js';
import { SpotsModule } from './modules/spots/spots.module.js';
import { RealtimeModule } from './modules/realtime/realtime.module.js';
import { SensorSimulatorModule } from './modules/sensor-simulator/sensor-simulator.module.js';
import { SessionsModule } from './modules/sessions/sessions.module.js';
import { ReservationsModule } from './modules/reservations/reservations.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    PassportGlobalModule,
    UsersModule,
    AuthModule,
    ZonesModule,
    SpotsModule,
    RealtimeModule,
    SensorSimulatorModule,
    SessionsModule,
    ReservationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
