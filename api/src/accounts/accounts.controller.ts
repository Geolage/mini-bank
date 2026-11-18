import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { AccountsService } from './accounts.service.js';
import { AccountDto } from './dto/account.dto.js';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List accounts owned by the authenticated user' })
  @ApiOkResponse({ type: [AccountDto] })
  list(@Req() request: Request & { user: AuthenticatedUser }): Promise<AccountDto[]> {
    return this.accountsService.listForUser(request.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one account owned by the authenticated user' })
  @ApiOkResponse({ type: AccountDto })
  @ApiNotFoundResponse({ description: 'Account not found' })
  getOne(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccountDto> {
    return this.accountsService.findOneForUser(request.user.id, id);
  }
}
