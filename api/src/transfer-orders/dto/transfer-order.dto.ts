import { ApiProperty } from '@nestjs/swagger';
import { AccountType, Currency, TransferOrderStatus } from '@prisma/client';

export class TransferOrderPartyDto {
  @ApiProperty({ example: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69' })
  id!: string;

  @ApiProperty({ example: 'Admin' })
  name!: string;

  @ApiProperty({ example: 'admin' })
  username!: string;
}

export class TransferOrderAccountDto {
  @ApiProperty({ example: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69' })
  id!: string;

  @ApiProperty({ example: 'MB-1001-0001' })
  accountNumber!: string;

  @ApiProperty({ enum: AccountType })
  type!: AccountType;
}

export class TransferOrderDto {
  @ApiProperty({ example: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69' })
  id!: string;

  @ApiProperty({ example: 'ORD-9c1e2d3c-4b5a-6987-8d4e-4b6f3f2b8c1a' })
  reference!: string;

  @ApiProperty({ enum: TransferOrderStatus })
  status!: TransferOrderStatus;

  @ApiProperty({ example: '10000.00' })
  amount!: string;

  @ApiProperty({ enum: Currency })
  currency!: Currency;

  @ApiProperty({ example: 'Invoice 42', nullable: true, type: String })
  note!: string | null;

  @ApiProperty({ example: '2026-11-19T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({
    example: '2026-11-19T11:00:00.000Z',
    nullable: true,
    type: String,
  })
  decidedAt!: string | null;

  @ApiProperty({ example: 'Checked invoice', nullable: true, type: String })
  decisionNote!: string | null;

  @ApiProperty({ type: TransferOrderPartyDto })
  maker!: TransferOrderPartyDto;

  @ApiProperty({ type: TransferOrderPartyDto, nullable: true })
  checker!: TransferOrderPartyDto | null;

  @ApiProperty({ type: TransferOrderAccountDto })
  fromAccount!: TransferOrderAccountDto;

  @ApiProperty({ type: TransferOrderAccountDto })
  toAccount!: TransferOrderAccountDto;

  @ApiProperty({
    example: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69',
    nullable: true,
    type: String,
  })
  transactionId!: string | null;
}

export class PaginatedTransferOrdersDto {
  @ApiProperty({ type: [TransferOrderDto] })
  items!: TransferOrderDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 3 })
  total!: number;
}
