import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto.js';
import { PaginatedTransactionsDto } from './dto/transaction.dto.js';
import { TransactionsService } from './transactions.service.js';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts/:accountId/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List transactions for one account (paginated)' })
  @ApiParam({
    name: 'accountId',
    description: 'Account owned by the authenticated user',
    format: 'uuid',
  })
  @ApiOkResponse({ type: PaginatedTransactionsDto })
  @ApiBadRequestResponse({
    description: 'Invalid pagination, direction or date parameters',
  })
  @ApiNotFoundResponse({ description: 'Account not found' })
  findAll(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Query() query: ListTransactionsQueryDto,
  ): Promise<PaginatedTransactionsDto> {
    return this.transactionsService.listForAccount(
      request.user.id,
      accountId,
      query,
    );
  }
}
