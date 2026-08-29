import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reservation, ReservationStatus, SpotStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SpotsService } from '../spots/spots.service.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';

export interface UpcomingWindow {
  id: string;
  startTime: Date;
  endTime: Date;
}

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spotsService: SpotsService,
  ) {}

  async create(
    userId: string,
    dto: CreateReservationDto,
  ): Promise<Reservation> {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const now = new Date();

    if (endTime <= startTime) {
      throw new BadRequestException(
        'Koha e mbarimit duhet të jetë pas kohës së fillimit',
      );
    }
    if (startTime < now) {
      throw new BadRequestException(
        "S'mund të rezervosh në një kohë të kaluar",
      );
    }

    const spot = await this.spotsService.findOne(dto.spotId);
    if (spot.status === SpotStatus.disabled) {
      throw new ConflictException('Ky vend parkimi është jashtë funksionit');
    }

    const conflict = await this.prisma.reservation.findFirst({
      where: {
        spotId: dto.spotId,
        status: ReservationStatus.confirmed,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    if (conflict) {
      throw new ConflictException(
        'Ky vend parkimi është tashmë i rezervuar në këtë interval kohor',
      );
    }

    return this.prisma.reservation.create({
      data: { spotId: dto.spotId, userId, startTime, endTime },
    });
  }

  findMine(userId: string): Promise<Reservation[]> {
    return this.prisma.reservation.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
    });
  }

  async cancel(userId: string, id: string): Promise<Reservation> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });
    if (!reservation) {
      throw new NotFoundException('Rezervimi nuk ekziston');
    }
    if (reservation.userId !== userId) {
      throw new ForbiddenException('Ky rezervim nuk të përket');
    }
    if (reservation.status === ReservationStatus.cancelled) {
      return reservation;
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.cancelled },
    });
  }

  findUpcomingForSpot(spotId: string): Promise<UpcomingWindow[]> {
    return this.prisma.reservation.findMany({
      where: {
        spotId,
        status: ReservationStatus.confirmed,
        endTime: { gt: new Date() },
      },
      select: { id: true, startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
    });
  }
}
