import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface AuditLogEntry {
  id: string;
  action: string;
  actorId: string | null;
  actorEmail: string | null;
  metadata: Prisma.JsonValue;
  timestamp: Date;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    action: string,
    actorId: string | null,
    metadata?: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: { action, actorId, metadata },
    });
  }

  async findRecent(limit = 100): Promise<AuditLogEntry[]> {
    const rows = await this.prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: { actor: { select: { email: true } } },
    });

    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      actorId: row.actorId,
      actorEmail: row.actor?.email ?? null,
      metadata: row.metadata,
      timestamp: row.timestamp,
    }));
  }
}
