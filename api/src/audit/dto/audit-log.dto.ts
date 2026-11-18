import { ApiProperty } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';

export class AuditActorDto {
  @ApiProperty({ example: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69' })
  id!: string;

  @ApiProperty({ example: 'Admin' })
  name!: string;

  @ApiProperty({ example: 'admin@minibank.dev' })
  email!: string;
}

export class AuditLogDto {
  @ApiProperty({ example: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69' })
  id!: string;

  @ApiProperty({ type: AuditActorDto })
  actor!: AuditActorDto;

  @ApiProperty({ example: 'TRANSFER_CREATED' })
  action!: string;

  @ApiProperty({ example: 'Transaction' })
  resourceType!: string;

  @ApiProperty({ example: '9a0c1e2d-3c4b-5a69-8d4e-4b6f3f2b8c1a', nullable: true, type: String })
  resourceId!: string | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: 'Structured event payload',
  })
  metadata!: Prisma.JsonValue;

  @ApiProperty({ example: '2026-10-31T10:00:00.000Z' })
  createdAt!: string;
}

export class PaginatedAuditLogsDto {
  @ApiProperty({ type: [AuditLogDto] })
  items!: AuditLogDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 3 })
  total!: number;
}
