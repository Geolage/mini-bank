import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class ApproveTransferOrderDto {
  @ApiPropertyOptional({
    example: 'Checked against invoice INV-42',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  decisionNote?: string;
}

export class RejectTransferOrderDto {
  @ApiProperty({ example: 'Missing invoice', maxLength: 200 })
  @IsString()
  @Length(1, 200)
  decisionNote!: string;
}
