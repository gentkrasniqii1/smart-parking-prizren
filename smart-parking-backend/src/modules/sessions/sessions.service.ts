import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ParkingSession,
  ReservationStatus,
  SessionSource,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
import { SPOT_STATUS_CHANNEL } from '../../redis/redis-channels.js';
import { SpotsService, SpotWithGeometry } from '../spots/spots.service.js';
import { CheckInDto } from './dto/check-in.dto.js';

export interface ActiveSession {
  session: ParkingSession;
  spot: SpotWithGeometry;
}

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spotsService: SpotsService,
    private readonly redisService: RedisService,
  ) {}

  async checkIn(userId: string, dto: CheckInDto): Promise<ParkingSession> {
    // Verifikon që spoti ekziston (404 nëse jo) para se të hyjmë në transaksion.
    await this.spotsService.findOne(dto.spotId);

    const session = await this.prisma.$transaction(async (tx) => {
      const activeSession = await tx.parkingSession.findFirst({
        where: { userId, checkOut: null },
      });
      if (activeSession) {
        throw new ConflictException(
          'Ke tashmë një sesion aktiv parkimi diku tjetër',
        );
      }

      // Rasti "konflikt rezervimi": dikush tjetër e ka rezervuar këtë spot
      // pikërisht tani — check-in-i i lirë s'duhet ta anashkalojë rezervimin.
      const now = new Date();
      const activeReservation = await tx.reservation.findFirst({
        where: {
          spotId: dto.spotId,
          status: ReservationStatus.confirmed,
          startTime: { lte: now },
          endTime: { gt: now },
          userId: { not: userId },
        },
      });
      if (activeReservation) {
        throw new ConflictException(
          'Ky vend parkimi është i rezervuar tani nga dikush tjetër',
        );
      }

      // "Compare-and-swap" atomik: e ndryshon statusin vetëm nëse ende është
      // "free" në momentin e vet UPDATE-it — mbron nga race condition kur dy
      // qytetarë bëjnë check-in njëkohësisht në të njëjtin spot.
      const affected = await tx.$executeRaw`
        UPDATE parking_spots SET status = 'occupied'::"SpotStatus", "updatedAt" = now()
        WHERE id = ${dto.spotId} AND status = 'free'::"SpotStatus"
      `;
      if (affected === 0) {
        throw new ConflictException('Ky vend parkimi nuk është i lirë');
      }

      return tx.parkingSession.create({
        data: {
          spotId: dto.spotId,
          userId,
          source: dto.source ?? SessionSource.manual,
        },
      });
    });

    await this.publishSpotUpdate(dto.spotId);
    return session;
  }

  async checkOut(userId: string): Promise<ParkingSession> {
    const session = await this.prisma.$transaction(async (tx) => {
      const activeSession = await tx.parkingSession.findFirst({
        where: { userId, checkOut: null },
      });
      if (!activeSession) {
        throw new NotFoundException('Nuk ke asnjë sesion aktiv parkimi');
      }

      await tx.$executeRaw`
        UPDATE parking_spots SET status = 'free'::"SpotStatus", "updatedAt" = now()
        WHERE id = ${activeSession.spotId}
      `;

      return tx.parkingSession.update({
        where: { id: activeSession.id },
        data: { checkOut: new Date() },
      });
    });

    await this.publishSpotUpdate(session.spotId);
    return session;
  }

  async findActiveForUser(userId: string): Promise<ActiveSession | null> {
    const session = await this.prisma.parkingSession.findFirst({
      where: { userId, checkOut: null },
    });
    if (!session) {
      return null;
    }
    const spot = await this.spotsService.findOne(session.spotId);
    return { session, spot };
  }

  private async publishSpotUpdate(spotId: string): Promise<void> {
    const updatedSpot = await this.spotsService.findOne(spotId);
    await this.redisService.publish(SPOT_STATUS_CHANNEL, updatedSpot);
  }
}
