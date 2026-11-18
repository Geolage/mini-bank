import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { TransactionDirection } from '../types/transaction-direction.js';

export class ListTransactionsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    default: 20,
    minimum: 1,
    maximum: 100,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @ApiPropertyOptional({
    enum: TransactionDirection,
    enumName: 'TransactionDirection',
    description: 'Direction relative to the requested account',
  })
  @IsOptional()
  @IsEnum(TransactionDirection)
  type?: TransactionDirection;

  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'Inclusive ISO 8601 start date/time',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-10-31',
    description:
      'Inclusive ISO 8601 end date/time; a date-only value covers the whole UTC day',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
