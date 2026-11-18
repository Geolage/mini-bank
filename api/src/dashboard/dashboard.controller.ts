import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto.js';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Balances, month flows, 30-day series and recent activity',
  })
  @ApiOkResponse({ type: DashboardOverviewDto })
  overview(
    @Req() request: Request & { user: AuthenticatedUser },
  ): Promise<DashboardOverviewDto> {
    return this.dashboardService.overview(request.user.id);
  }
}
