import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SpotStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ZonesService } from '../zones/zones.service.js';
import { CreateSpotDto } from './dto/create-spot.dto.js';
import { UpdateSpotDto } from './dto/update-spot.dto.js';
import { GeoPointDto } from '../../common/dto/geo-point.dto.js';

interface SpotRow {
  id: string;
  code: string;
  location: string;
  status: SpotStatus;
  zoneId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpotWithGeometry {
  id: string;
  code: string;
  location: GeoPointDto;
  status: SpotStatus;
  zoneId: string;
  createdAt: Date;
  updatedAt: Date;
}

const POSTGRES_UNIQUE_VIOLATION = '23505';

const SPOT_COLUMNS = Prisma.sql`id, code, ST_AsGeoJSON(location) AS location, status, "zoneId", "createdAt", "updatedAt"`;

@Injectable()
export class SpotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zonesService: ZonesService,
  ) {}

  async findAll(zoneId?: string): Promise<SpotWithGeometry[]> {
    const rows = zoneId
      ? await this.prisma.$queryRaw<SpotRow[]>`
          SELECT ${SPOT_COLUMNS} FROM parking_spots WHERE "zoneId" = ${zoneId} ORDER BY code ASC
        `
      : await this.prisma.$queryRaw<SpotRow[]>`
          SELECT ${SPOT_COLUMNS} FROM parking_spots ORDER BY code ASC
        `;
    return rows.map((row) => this.toSpot(row));
  }

  async findOne(id: string): Promise<SpotWithGeometry> {
    const rows = await this.prisma.$queryRaw<SpotRow[]>`
      SELECT ${SPOT_COLUMNS} FROM parking_spots WHERE id = ${id}
    `;
    const row = rows[0];
    if (!row) {
      throw new NotFoundException(`Spoti ${id} nuk ekziston`);
    }
    return this.toSpot(row);
  }

  async create(dto: CreateSpotDto): Promise<SpotWithGeometry> {
    await this.zonesService.findOne(dto.zoneId);

    try {
      const rows = await this.prisma.$queryRaw<SpotRow[]>`
        INSERT INTO parking_spots (id, code, location, status, "zoneId", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          ${dto.code},
          ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(dto.location)}), 4326),
          ${dto.status ?? SpotStatus.free}::"SpotStatus",
          ${dto.zoneId},
          now(),
          now()
        )
        RETURNING ${SPOT_COLUMNS}
      `;
      return this.toSpot(rows[0]);
    } catch (error) {
      throw this.mapWriteError(error, dto.zoneId, dto.code);
    }
  }

  async update(id: string, dto: UpdateSpotDto): Promise<SpotWithGeometry> {
    const existing = await this.findOne(id);
    if (dto.zoneId) {
      await this.zonesService.findOne(dto.zoneId);
    }

    const code = dto.code ?? existing.code;
    const zoneId = dto.zoneId ?? existing.zoneId;
    const status = dto.status ?? existing.status;
    const locationFragment = dto.location
      ? Prisma.sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(dto.location)}), 4326)`
      : Prisma.sql`location`;

    try {
      const rows = await this.prisma.$queryRaw<SpotRow[]>`
        UPDATE parking_spots
        SET code = ${code},
            "zoneId" = ${zoneId},
            status = ${status}::"SpotStatus",
            location = ${locationFragment},
            "updatedAt" = now()
        WHERE id = ${id}
        RETURNING ${SPOT_COLUMNS}
      `;
      return this.toSpot(rows[0]);
    } catch (error) {
      throw this.mapWriteError(error, zoneId, code);
    }
  }

  async remove(id: string): Promise<void> {
    const affected = await this.prisma.$executeRaw`
      DELETE FROM parking_spots WHERE id = ${id}
    `;
    if (affected === 0) {
      throw new NotFoundException(`Spoti ${id} nuk ekziston`);
    }
  }

  private mapWriteError(error: unknown, zoneId: string, code: string): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2010' &&
      (error.meta as { code?: string } | undefined)?.code ===
        POSTGRES_UNIQUE_VIOLATION
    ) {
      return new ConflictException(
        `Spoti me kod "${code}" ekziston tashmë në këtë zonë (${zoneId})`,
      );
    }
    return error;
  }

  private toSpot(row: SpotRow): SpotWithGeometry {
    return {
      id: row.id,
      code: row.code,
      location: JSON.parse(row.location) as GeoPointDto,
      status: row.status,
      zoneId: row.zoneId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
