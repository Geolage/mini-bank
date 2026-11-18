import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePayeeDto {
  @ApiProperty({ example: 'Visitor checking', minLength: 1, maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @ApiProperty({
    example: 'MB-2001-0001',
    description: 'In-bank account number in MB-0000-0000 form',
  })
  @Matches(/^MB-\d{4}-\d{4}$/, {
    message: 'accountNumber must look like MB-0000-0000',
  })
  accountNumber!: string;

  @ApiPropertyOptional({ example: 'MiniBank', maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  bankName?: string;

  @ApiPropertyOptional({ example: 'Rent share', maxLength: 140 })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  note?: string;
}
