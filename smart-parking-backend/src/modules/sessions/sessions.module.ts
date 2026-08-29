import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller.js';
import { SessionsService } from './sessions.service.js';
import { SpotsModule } from '../spots/spots.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [SpotsModule, NotificationsModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
