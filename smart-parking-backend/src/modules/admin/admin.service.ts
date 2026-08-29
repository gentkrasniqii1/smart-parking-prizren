import { Injectable } from '@nestjs/common';
import { SpotStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface AdminStats {
  totalZones: number;
  totalSpots: number;
  spotsByStatus: Record<SpotStatus, number>;
  activeSessions: number;
  activeReservations: number;
}

const EMPTY_STATUS_COUNTS: Record<SpotStatus, number> = {
  free: 0,
  occupied: 0,
  reserved: 0,
  disabled: 0,
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<AdminStats> {
    const [
      totalZones,
      totalSpots,
      statusGroups,
      activeSessions,
      activeReservations,
    ] = await Promise.all([
      this.prisma.parkingZone.count(),
      this.prisma.parkingSpot.count(),
      this.prisma.parkingSpot.groupBy({ by: ['status'], _count: true }),
      this.prisma.parkingSession.count({ where: { checkOut: null } }),
      this.prisma.reservation.count({
        where: { status: 'confirmed', endTime: { gt: new Date() } },
      }),
    ]);

    const spotsByStatus = { ...EMPTY_STATUS_COUNTS };
    for (const group of statusGroups) {
      spotsByStatus[group.status] = group._count;
    }

    return {
      totalZones,
      totalSpots,
      spotsByStatus,
      activeSessions,
      activeReservations,
    };
  }
}
