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

export type AlertLevel = 'critical' | 'warning' | 'info';

export interface AdminAlert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  href: string | null;
  timestamp: string;
}

const ZONE_OCCUPANCY_CRITICAL = 0.9;
const ZONE_OCCUPANCY_WARNING = 0.75;
const ZONE_MIN_SPOTS_FOR_ALERT = 3;

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

  // Alarme të nxjerra nga të dhëna REALE (jo të ruajtura/të simuluara) —
  // rillogariten në çdo thirrje, prandaj s'kanë nevojë për "acknowledge"/DB
  // të veçantë; niveli (critical/warning/info) përcaktohet nga pragjet më
  // poshtë. §59 e promptit kërkon shprehimisht që klikimi i alarmit të çojë
  // te entiteti përkatës.
  async getAlerts(): Promise<AdminAlert[]> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [spotGroups, zones, recentReservations, health] = await Promise.all([
      this.prisma.parkingSpot.groupBy({ by: ['zoneId', 'status'], _count: true }),
      this.prisma.parkingZone.findMany({ select: { id: true, name: true } }),
      this.prisma.reservation.count({
        where: { createdAt: { gte: oneHourAgo } },
      }),
      this.getSystemHealth(),
    ]);

    const zoneNameById = new Map(zones.map((z) => [z.id, z.name]));
    const totalsByZone = new Map<string, { total: number; occupied: number }>();
    for (const group of spotGroups) {
      const entry = totalsByZone.get(group.zoneId) ?? { total: 0, occupied: 0 };
      entry.total += group._count;
      if (group.status === 'occupied') {
        entry.occupied += group._count;
      }
      totalsByZone.set(group.zoneId, entry);
    }

    const alerts: AdminAlert[] = [];

    for (const [zoneId, { total, occupied }] of totalsByZone) {
      if (total < ZONE_MIN_SPOTS_FOR_ALERT) {
        continue;
      }
      const rate = occupied / total;
      const zoneName = zoneNameById.get(zoneId) ?? 'Zonë e panjohur';
      const percent = Math.round(rate * 100);
      if (rate >= ZONE_OCCUPANCY_CRITICAL) {
        alerts.push({
          id: `zone-occupancy-${zoneId}`,
          level: 'critical',
          title: `Zona "${zoneName}" pothuajse plot`,
          message: `${percent}% e vendparkimeve janë të zëna (${occupied}/${total}).`,
          href: '/admin/zones',
          timestamp: now.toISOString(),
        });
      } else if (rate >= ZONE_OCCUPANCY_WARNING) {
        alerts.push({
          id: `zone-occupancy-${zoneId}`,
          level: 'warning',
          title: `Zona "${zoneName}" me shkallë të lartë zënieje`,
          message: `${percent}% e vendparkimeve janë të zëna (${occupied}/${total}).`,
          href: '/admin/zones',
          timestamp: now.toISOString(),
        });
      }
    }

    if (health.database.status === 'error') {
      alerts.push({
        id: 'system-health-database',
        level: 'critical',
        title: 'Baza e të dhënave s\'përgjigjet',
        message: 'Kontrolli i fundit i shëndetit dështoi për bazën e të dhënave.',
        href: '/admin/system-health',
        timestamp: now.toISOString(),
      });
    }
    if (health.redis.status === 'error') {
      alerts.push({
        id: 'system-health-redis',
        level: 'critical',
        title: 'Redis s\'përgjigjet',
        message:
          'Përditësimet live (statuse spotesh, njoftime) mund të mos funksionojnë.',
        href: '/admin/system-health',
        timestamp: now.toISOString(),
      });
    }

    if (recentReservations > 0) {
      alerts.push({
        id: 'reservations-last-hour',
        level: 'info',
        title: 'Aktivitet rezervimesh',
        message: `${recentReservations} rezervime të reja në orën e fundit.`,
        href: '/admin/audit-log',
        timestamp: now.toISOString(),
      });
    }

    const levelOrder: Record<AlertLevel, number> = { critical: 0, warning: 1, info: 2 };
    return alerts.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
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
