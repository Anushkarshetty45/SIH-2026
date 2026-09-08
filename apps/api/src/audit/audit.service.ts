import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface CreateAuditLogParams {
  action: string;
  actorId?: string | null;
  entity: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    action: string,
    actorId: string | null = null,
    entity: string,
    entityId: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
  ) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          action,
          actorId: actorId || null,
          entity,
          entityId,
          metadata: metadata ?? undefined,
          ipAddress,
        },
      });
    } catch (error) {
      // Do not let audit failures break the main flow, but log error
      console.error('[AuditService] Failed to write audit log:', error);
      return null;
    }
  }

  async findByEntity(entity: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entity, entityId },
      include: {
        actor: {
          select: { id: true, name: true, role: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByActor(actorId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { actorId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async list(page = 1, limit = 50, entity?: string, action?: string) {
    const skip = (page - 1) * limit;
    const where = {
      ...(entity ? { entity } : {}),
      ...(action ? { action } : {}),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          actor: {
            select: { id: true, name: true, role: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }
}
