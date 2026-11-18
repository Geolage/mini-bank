import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { AuditService } from './audit.service.js';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto.js';
import { PaginatedAuditLogsDto } from './dto/audit-log.dto.js';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.OPERATOR)
  @ApiOperation({ summary: 'List audit logs (operator only)' })
  @ApiOkResponse({ type: PaginatedAuditLogsDto })
  @ApiBadRequestResponse({ description: 'Invalid pagination or filter values' })
  @ApiForbiddenResponse({ description: 'Operator role required' })
  findAll(
    @Query() query: ListAuditLogsQueryDto,
  ): Promise<PaginatedAuditLogsDto> {
    return this.auditService.list(query);
  }
}
