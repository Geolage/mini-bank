import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({ description: 'Account the money leaves (must belong to you)' })
  @IsUUID()
  fromAccountId!: string;

  @ApiProperty({ example: 'MB-2001-0001' })
  @IsString()
  @Length(4, 32)
  toAccountNumber!: string;

  @ApiProperty({ example: '120.50', description: 'Decimal string, up to 2 places' })
  @IsString()
  @Matches(/^\d{1,12}(\.\d{1,2})?$/, {
    message: 'amount must be a positive decimal with up to 2 places',
  })
  amount!: string;

  @ApiPropertyOptional({ example: 'Rent share' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  note?: string;
}
