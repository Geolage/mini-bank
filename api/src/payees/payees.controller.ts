import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreatePayeeDto } from './dto/create-payee.dto.js';
import { ListPayeesQueryDto } from './dto/list-payees-query.dto.js';
import { PaginatedPayeesDto, PayeeDto } from './dto/payee.dto.js';
import { UpdatePayeeDto } from './dto/update-payee.dto.js';
import { PayeesService } from './payees.service.js';

@ApiTags('payees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payees')
export class PayeesController {
  constructor(private readonly payeesService: PayeesService) {}

  @Get()
  @ApiOperation({ summary: 'List the authenticated user’s saved payees' })
  @ApiOkResponse({ type: PaginatedPayeesDto })
  list(
    @Req() request: Request & { user: AuthenticatedUser },
    @Query() query: ListPayeesQueryDto,
  ): Promise<PaginatedPayeesDto> {
    return this.payeesService.list(request.user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Save a new payee' })
  @ApiCreatedResponse({ type: PayeeDto })
  @ApiConflictResponse({ description: 'Account number already saved' })
  create(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: CreatePayeeDto,
  ): Promise<PayeeDto> {
    return this.payeesService.create(request.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one saved payee' })
  @ApiOkResponse({ type: PayeeDto })
  @ApiNotFoundResponse({ description: 'Payee not found' })
  getOne(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PayeeDto> {
    return this.payeesService.findOne(request.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a saved payee' })
  @ApiOkResponse({ type: PayeeDto })
  @ApiNotFoundResponse({ description: 'Payee not found' })
  @ApiConflictResponse({ description: 'Account number already saved' })
  update(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayeeDto,
  ): Promise<PayeeDto> {
    return this.payeesService.update(request.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saved payee' })
  @ApiOkResponse({ type: PayeeDto })
  @ApiNotFoundResponse({ description: 'Payee not found' })
  remove(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PayeeDto> {
    return this.payeesService.remove(request.user.id, id);
  }
}
