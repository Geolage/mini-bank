import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const PAYEE_SORTS = ['name', 'nameDesc', 'updated', 'created'] as const;
export type PayeeSort = (typeof PAYEE_SORTS)[number];

export class ListPayeesQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @ApiPropertyOptional({
    example: 'visitor',
    description: 'Case-insensitive match on name, account number or bank',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @ApiPropertyOptional({ enum: PAYEE_SORTS, default: 'name' })
  @IsOptional()
  @IsIn(PAYEE_SORTS as unknown as string[])
  sort: PayeeSort = 'name';
}
