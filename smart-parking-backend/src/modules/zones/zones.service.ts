import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { CreateZoneDto } from './dto/create-zone.dto.js';
import { UpdateZoneDto } from './dto/update-zone.dto.js';
import { GeoPolygonDto } from '../../common/dto/geo-polygon.dto.js';

interface ZoneRow {
  id: string;
  name: string;
  polygon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ZoneWithGeometry {
  id: string;
  name: string;
  polygon: GeoPolygonDto;
  createdAt: Date;
  updatedAt: Date;
}

const ZONE_COLUMNS = Prisma.sql`id, name, ST_AsGeoJSON(polygon) AS polygon, "createdAt", "updatedAt"`;

@Injectable()
export class ZonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(): Promise<ZoneWithGeometry[]> {
    const rows = await this.prisma.$queryRaw<ZoneRow[]>`
      SELECT ${ZONE_COLUMNS} FROM parking_zones ORDER BY "createdAt" ASC
    `;
    return rows.map((row) => this.toZone(row));
  }

  async findOne(id: string): Promise<ZoneWithGeometry> {
    const rows = await this.prisma.$queryRaw<ZoneRow[]>`
      SELECT ${ZONE_COLUMNS} FROM parking_zones WHERE id = ${id}
    `;
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(`Zona ${id} nuk ekziston`);
    }
    return this.toZone(row);
  }

  async create(dto: CreateZoneDto, actorId: string): Promise<ZoneWithGeometry> {
    const rows = await this.prisma.$queryRaw<ZoneRow[]>`
      INSERT INTO parking_zones (id, name, polygon, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        ${dto.name},
        ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(dto.polygon)}), 4326),
        now(),
        now()
      )
      RETURNING ${ZONE_COLUMNS}
    `;
    const zone = this.toZone(rows[0]);
    await this.auditLogService.record('zone.create', actorId, {
      zoneId: zone.id,
      name: zone.name,
    });
    return zone;
  }

  async update(
    id: string,
    dto: UpdateZoneDto,
    actorId: string,
  ): Promise<ZoneWithGeometry> {
    const existing = await this.findOne(id);
    const name = dto.name ?? existing.name;
    const polygonFragment = dto.polygon
      ? Prisma.sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(dto.polygon)}), 4326)`
      : Prisma.sql`polygon`;

    const rows = await this.prisma.$queryRaw<ZoneRow[]>`
      UPDATE parking_zones
      SET name = ${name}, polygon = ${polygonFragment}, "updatedAt" = now()
      WHERE id = ${id}
      RETURNING ${ZONE_COLUMNS}
    `;
    const zone = this.toZone(rows[0]);
    await this.auditLogService.record('zone.update', actorId, {
      zoneId: zone.id,
      name: zone.name,
    });
    return zone;
  }

  async remove(id: string, actorId: string): Promise<void> {
    const existing = await this.findOne(id);
    const affected = await this.prisma.$executeRaw`
      DELETE FROM parking_zones WHERE id = ${id}
    `;
    if (affected === 0) {
      throw new NotFoundException(`Zona ${id} nuk ekziston`);
    }
    await this.auditLogService.record('zone.delete', actorId, {
      zoneId: id,
      name: existing.name,
    });
  }

  private toZone(row: ZoneRow): ZoneWithGeometry {
    return {
      id: row.id,
      name: row.name,
      polygon: JSON.parse(row.polygon) as GeoPolygonDto,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
