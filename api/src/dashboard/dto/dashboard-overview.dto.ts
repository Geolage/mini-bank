import { ApiProperty } from '@nestjs/swagger';
import type { Currency } from '@prisma/client';

export class CurrencyTotalDto {
  @ApiProperty({ example: 'USD' })
  currency!: Currency;

  @ApiProperty({ example: '12500.00' })
  balance!: string;

  @ApiProperty({ example: 2 })
  accounts!: number;
}

export class CurrencyFlowDto {
  @ApiProperty({ example: 'USD' })
  currency!: Currency;

  @ApiProperty({ example: '94.25' })
  incoming!: string;

  @ApiProperty({ example: '292.00' })
  outgoing!: string;
}

export class SeriesPointDto {
  @ApiProperty({ example: '2026-11-05' })
  date!: string;

  @ApiProperty({ example: '18.75' })
  incoming!: string;

  @ApiProperty({ example: '42.00' })
  outgoing!: string;
}

export class DashboardSeriesDto {
  @ApiProperty({ example: 'USD' })
  currency!: Currency;

  @ApiProperty({ type: [SeriesPointDto] })
  points!: SeriesPointDto[];
}

export class RecentTransactionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'TXN-…' })
  reference!: string;

  @ApiProperty({ example: 'OUTGOING' })
  direction!: 'INCOMING' | 'OUTGOING';

  @ApiProperty({ example: '42.00' })
  amount!: string;

  @ApiProperty({ example: 'USD' })
  currency!: Currency;

  @ApiProperty({ example: 'MB-2001-0001' })
  counterpartyAccountNumber!: string;

  @ApiProperty()
  accountId!: string;

  @ApiProperty({ nullable: true, example: 'Coffee beans' })
  note!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class DashboardOverviewDto {
  @ApiProperty({ type: [CurrencyTotalDto] })
  totals!: CurrencyTotalDto[];

  @ApiProperty({ example: 2 })
  payeeCount!: number;

  @ApiProperty({ type: [CurrencyFlowDto] })
  month!: CurrencyFlowDto[];

  @ApiProperty({ type: [DashboardSeriesDto] })
  series!: DashboardSeriesDto[];

  @ApiProperty({ type: [RecentTransactionDto] })
  recent!: RecentTransactionDto[];
}
