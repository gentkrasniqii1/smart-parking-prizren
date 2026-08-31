import { Injectable } from '@nestjs/common';
import { SpotStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { GeoPointDto } from '../../common/dto/geo-point.dto.js';

export interface ServiceHealth {
  status: 'ok' | 'error';
  latencyMs: number | null;
}

export interface SystemHealth {
  api: { status: 'ok'; timestamp: string };
  database: ServiceHealth;
  redis: ServiceHealth;
  websocket: { status: 'ok'; connectedClients: number };
  sensorSimulator: { enabled: boolean };
}

export interface AdminStats {
  totalZones: number;
  totalSpots: number;
  spotsByStatus: Record<SpotStatus, number>;
  activeSessions: number;
  activeReservations: number;
}

export interface HeatmapFeature {
  type: 'Feature';
  geometry: GeoPointDto;
  properties: { spotId: string; code: string; zoneId: string; weight: number };
}

export interface HeatmapResponse {
  type: 'FeatureCollection';
  features: HeatmapFeature[];
}

export interface PeakHourBucket {
  hour: number;
  count: number;
}

interface HeatmapRow {
  id: string;
  code: string;
  zoneId: string;
  location: string;
  weight: number;
}

interface PeakHourRow {
  hour: number;
  count: number;
}

const EMPTY_STATUS_COUNTS: Record<SpotStatus, number> = {
  free: 0,
  occupied: 0,
  reserved: 0,
  disabled: 0,
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async getSystemHealth(): Promise<SystemHealth> {
    const [database, redis] = await Promise.all([
      this.checkLatency(() => this.prisma.$queryRaw`SELECT 1`),
      this.checkLatency(() => this.redisService.publisher.ping()),
    ]);

    return {
      api: { status: 'ok', timestamp: new Date().toISOString() },
      database,
      redis,
      websocket: {
        status: 'ok',
        connectedClients: this.realtimeGateway.getConnectedClientsCount(),
      },
      sensorSimulator: {
        enabled: process.env.SENSOR_SIMULATOR_ENABLED !== 'false',
      },
    };
  }

  private async checkLatency(
    check: () => Promise<unknown>,
  ): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await check();
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch {
      return { status: 'error', latencyMs: null };
    }
  }

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

  // "Aktivitet i zënies" = tranzicione occupied nga sensori (SensorEvent,
  // Faza 3) + check-in-e manuale (ParkingSession.checkIn, Faza 4) — bashkohen
  // sepse që të dyja pasqyrojnë kërkesë reale parkimi te ai spot, jo vetëm
  // burimi i simuluar. Dritarja kohore (`days`) filtrohet me `make_interval`
  // (parametër i lidhur, jo string-concat) për të shmangur SQL injection.
  async getHeatmap(days: number): Promise<HeatmapResponse> {
    const rows = await this.prisma.$queryRaw<HeatmapRow[]>`
      SELECT s.id, s.code, s."zoneId", ST_AsGeoJSON(s.location) AS location,
        (COALESCE(se.cnt, 0) + COALESCE(ps.cnt, 0))::int AS weight
      FROM parking_spots s
      LEFT JOIN (
        SELECT "spotId", COUNT(*)::int AS cnt FROM sensor_events
        WHERE status = 'occupied'::"SpotStatus"
          AND timestamp >= now() - make_interval(days => ${days}::int)
        GROUP BY "spotId"
      ) se ON se."spotId" = s.id
      LEFT JOIN (
        SELECT "spotId", COUNT(*)::int AS cnt FROM parking_sessions
        WHERE "checkIn" >= now() - make_interval(days => ${days}::int)
        GROUP BY "spotId"
      ) ps ON ps."spotId" = s.id
      ORDER BY s.code ASC
    `;

    return {
      type: 'FeatureCollection',
      features: rows.map((row) => ({
        type: 'Feature',
        geometry: JSON.parse(row.location) as GeoPointDto,
        properties: {
          spotId: row.id,
          code: row.code,
          zoneId: row.zoneId,
          weight: row.weight,
        },
      })),
    };
  }

  // I njëjti burim aktiviteti si getHeatmap, grupuar sipas orës së ditës
  // (0-23, orë lokale e serverit) për të nxjerrë "orët e pikut".
  async getPeakHours(days: number): Promise<PeakHourBucket[]> {
    const rows = await this.prisma.$queryRaw<PeakHourRow[]>`
      SELECT EXTRACT(HOUR FROM ts)::int AS hour, COUNT(*)::int AS count
      FROM (
        SELECT timestamp AS ts FROM sensor_events
        WHERE status = 'occupied'::"SpotStatus"
          AND timestamp >= now() - make_interval(days => ${days}::int)
        UNION ALL
        SELECT "checkIn" AS ts FROM parking_sessions
        WHERE "checkIn" >= now() - make_interval(days => ${days}::int)
      ) activity
      GROUP BY hour
      ORDER BY hour
    `;

    const counts = new Map(rows.map((row) => [row.hour, row.count]));
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: counts.get(hour) ?? 0,
    }));
  }
}
