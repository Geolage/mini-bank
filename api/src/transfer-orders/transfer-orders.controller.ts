import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { TransferResultDto } from '../transfers/dto/transfer-result.dto.js';
import {
  ApproveTransferOrderDto,
  RejectTransferOrderDto,
} from './dto/decide-transfer-order.dto.js';
import { ListTransferOrdersQueryDto } from './dto/list-transfer-orders-query.dto.js';
import { PaginatedTransferOrdersDto } from './dto/transfer-order.dto.js';
import { TransferOrdersService } from './transfer-orders.service.js';

@ApiTags('transfer-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transfer-orders')
export class TransferOrdersController {
  constructor(private readonly transferOrdersService: TransferOrdersService) {}

  @Get()
  @Roles(Role.OPERATOR, Role.CHECKER)
  @ApiOperation({
    summary: 'List transfer orders (operator: own, checker: all)',
  })
  @ApiOkResponse({ type: PaginatedTransferOrdersDto })
  @ApiBadRequestResponse({ description: 'Invalid pagination or status' })
  @ApiForbiddenResponse({ description: 'Operator or checker role required' })
  list(
    @Req() request: Request & { user: AuthenticatedUser },
    @Query() query: ListTransferOrdersQueryDto,
  ): Promise<PaginatedTransferOrdersDto> {
    return this.transferOrdersService.list(
      request.user.id,
      request.user.role,
      query,
    );
  }

  @Post(':id/approve')
  @Roles(Role.CHECKER)
  @ApiOperation({ summary: 'Approve a pending transfer order' })
  @ApiCreatedResponse({ type: TransferResultDto })
  @ApiBadRequestResponse({ description: 'Insufficient funds or invalid note' })
  @ApiForbiddenResponse({ description: 'Checker role required' })
  @ApiNotFoundResponse({ description: 'Transfer order not found' })
  @ApiConflictResponse({ description: 'Order is no longer pending' })
  approve(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveTransferOrderDto,
  ): Promise<TransferResultDto> {
    return this.transferOrdersService.approve(request.user.id, id, dto);
  }

  @Post(':id/reject')
  @Roles(Role.CHECKER)
  @ApiOperation({ summary: 'Reject a pending transfer order with a reason' })
  @ApiCreatedResponse({ type: TransferResultDto })
  @ApiBadRequestResponse({ description: 'Missing or invalid reason' })
  @ApiForbiddenResponse({ description: 'Checker role required' })
  @ApiNotFoundResponse({ description: 'Transfer order not found' })
  @ApiConflictResponse({ description: 'Order is no longer pending' })
  reject(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectTransferOrderDto,
  ): Promise<TransferResultDto> {
    return this.transferOrdersService.reject(request.user.id, id, dto);
  }

  @Post(':id/cancel')
  @Roles(Role.OPERATOR)
  @ApiOperation({ summary: 'Cancel your own pending transfer order' })
  @ApiCreatedResponse({ type: TransferResultDto })
  @ApiForbiddenResponse({ description: 'Only the maker can cancel' })
  @ApiNotFoundResponse({ description: 'Transfer order not found' })
  @ApiConflictResponse({ description: 'Order is no longer pending' })
  cancel(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TransferResultDto> {
    return this.transferOrdersService.cancel(request.user.id, id);
  }
}
