import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  Notification,
  NotificationType,
  ReservationStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
import { NOTIFICATION_CHANNEL } from '../../redis/redis-channels.js';

const REMINDER_WINDOW_MS = 15 * 60 * 1000;
const REMINDER_CHECK_INTERVAL_MS = 60 * 1000;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    message: string,
  ): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: { userId, type, message },
    });
    await this.redisService.publish(NOTIFICATION_CHANNEL, {
      userId,
      notification,
    });
    return notification;
  }

  findMine(userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  async markRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException('Njoftimi nuk ekziston');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException('Ky njoftim nuk të përket');
    }
    if (notification.read) {
      return notification;
    }
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  // Kujtesë "rezervimi fillon së shpejti" — kontrollohet çdo minutë; shënon
  // reminderSent që të mos e dërgojë dy herë (shih komentin te schema.prisma).
  @Interval(REMINDER_CHECK_INTERVAL_MS)
  async checkReminders(): Promise<void> {
    const now = new Date();
    const soon = new Date(now.getTime() + REMINDER_WINDOW_MS);

    const upcoming = await this.prisma.reservation.findMany({
      where: {
        status: ReservationStatus.confirmed,
        reminderSent: false,
        startTime: { gt: now, lte: soon },
      },
    });

    for (const reservation of upcoming) {
      const spot = await this.prisma.parkingSpot.findUnique({
        where: { id: reservation.spotId },
        select: { code: true },
      });
      const startLabel = reservation.startTime.toLocaleTimeString('sq-AL', {
        hour: '2-digit',
        minute: '2-digit',
      });

      await this.create(
        reservation.userId,
        NotificationType.reservation_reminder,
        `Rezervimi yt për spotin ${spot?.code ?? reservation.spotId} fillon në ${startLabel}`,
      );
      await this.prisma.reservation.update({
        where: { id: reservation.id },
        data: { reminderSent: true },
      });
    }
  }
}
