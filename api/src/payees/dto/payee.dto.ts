import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PayeeDto {
  @ApiProperty({ example: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69' })
  id!: string;

  @ApiProperty({ example: 'Visitor checking' })
  name!: string;

  @ApiProperty({ example: 'MB-2001-0001' })
  accountNumber!: string;

  @ApiProperty({ example: 'MiniBank' })
  bankName!: string;

  @ApiPropertyOptional({ example: 'Rent share', nullable: true })
  note!: string | null;

  @ApiProperty({ example: '2026-11-05T08:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-11-05T08:00:00.000Z' })
  updatedAt!: string;
}

export class PaginatedPayeesDto {
  @ApiProperty({ type: [PayeeDto] })
  items!: PayeeDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 3 })
  total!: number;
}
