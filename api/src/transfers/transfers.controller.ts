import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreateTransferDto } from './dto/create-transfer.dto.js';
import { TransferResultDto } from './dto/transfer-result.dto.js';
import { TransfersService } from './transfers.service.js';

@ApiTags('transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @Roles(Role.OPERATOR)
  @ApiOperation({ summary: 'Create a transfer (operator only, idempotent)' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Client-generated UUID used to make retries safe',
  })
  @ApiCreatedResponse({ type: TransferResultDto })
  @ApiBadRequestResponse({
    description: 'Invalid body, amount, idempotency key or business rule',
  })
  @ApiForbiddenResponse({ description: 'Operator role required' })
  @ApiNotFoundResponse({ description: 'Source or destination account missing' })
  create(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: CreateTransferDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<TransferResultDto> {
    return this.transfersService.create(request.user.id, dto, idempotencyKey);
  }
}
