import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransferOrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListTransferOrdersQueryDto {
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
    enum: TransferOrderStatus,
    enumName: 'TransferOrderStatus',
  })
  @IsOptional()
  @IsEnum(TransferOrderStatus)
  status?: TransferOrderStatus;
}
