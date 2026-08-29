import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PassportGlobalModule } from './common/passport-global.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ZonesModule } from './modules/zones/zones.module.js';
import { SpotsModule } from './modules/spots/spots.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    PassportGlobalModule,
    UsersModule,
    AuthModule,
    ZonesModule,
    SpotsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
