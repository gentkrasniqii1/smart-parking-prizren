import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller.js';
import { ReservationsService } from './reservations.service.js';
import { SpotsModule } from '../spots/spots.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [SpotsModule, NotificationsModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
