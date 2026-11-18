import { ApiProperty } from '@nestjs/swagger';
import { Currency, TransactionStatus } from '@prisma/client';

export class TransactionDto {
  @ApiProperty({ example: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69' })
  id!: string;

  @ApiProperty({ example: 'SEED-TXN-001' })
  reference!: string;

  @ApiProperty({ example: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69' })
  fromAccountId!: string;

  @ApiProperty({ example: '9a0c1e2d-3c4b-5a69-8d4e-4b6f3f2b8c1a' })
  toAccountId!: string;

  @ApiProperty({
    example: '250.00',
    description: 'Decimal string with 2 places',
  })
  amount!: string;

  @ApiProperty({ enum: Currency, example: Currency.USD })
  currency!: Currency;

  @ApiProperty({
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED,
  })
  status!: TransactionStatus;

  @ApiProperty({ example: 'Dinner split', nullable: true, type: String })
  note!: string | null;

  @ApiProperty({ example: '2026-10-31T10:00:00.000Z' })
  createdAt!: string;
}

export class PaginatedTransactionsDto {
  @ApiProperty({ type: [TransactionDto] })
  items!: TransactionDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 6 })
  total!: number;
}
