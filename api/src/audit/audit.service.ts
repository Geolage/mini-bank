import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { buildCreatedAtFilter } from '../common/utils/date-filter.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto.js';
import type {
  AuditLogDto,
  PaginatedAuditLogsDto,
} from './dto/audit-log.dto.js';

type AuditLogWithActor = Prisma.AuditLogGetPayload<{
  include: { actor: { select: { id: true; name: true; email: true } } };
}>;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListAuditLogsQueryDto): Promise<PaginatedAuditLogsDto> {
    const createdAt = buildCreatedAtFilter(query.from, query.to);
    const where: Prisma.AuditLogWhereInput = {
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(createdAt ? { createdAt } : {}),
    };

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: logs.map(toAuditLogDto),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }
}

function toAuditLogDto(log: AuditLogWithActor): AuditLogDto {
  return {
    id: log.id,
    actor: log.actor,
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    metadata: log.metadata,
    createdAt: log.createdAt.toISOString(),
  };
}
