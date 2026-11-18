import { Injectable } from '@nestjs/common';
import type { Currency, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  DashboardOverviewDto,
  DashboardSeriesDto,
  RecentTransactionDto,
} from './dto/dashboard-overview.dto.js';

const SERIES_DAYS = 30;
const RECENT_LIMIT = 6;

type TransactionWithAccounts = Prisma.TransactionGetPayload<{
  include: {
    fromAccount: { select: { accountNumber: true; userId: true } };
    toAccount: { select: { accountNumber: true; userId: true } };
  };
}>;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(userId: string): Promise<DashboardOverviewDto> {
    const accounts = await this.prisma.account.findMany({ where: { userId } });
    const accountIds = accounts.map((account) => account.id);
    const owned = new Set(accountIds);

    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const seriesStart = new Date(now);
    seriesStart.setUTCDate(seriesStart.getUTCDate() - (SERIES_DAYS - 1));
    seriesStart.setUTCHours(0, 0, 0, 0);
    const since = monthStart < seriesStart ? monthStart : seriesStart;

    const [transactions, payeeCount] = await Promise.all([
      accountIds.length === 0
        ? Promise.resolve([] as TransactionWithAccounts[])
        : this.prisma.transaction.findMany({
            where: {
              createdAt: { gte: since },
              OR: [
                { fromAccountId: { in: accountIds } },
                { toAccountId: { in: accountIds } },
              ],
            },
            include: {
              fromAccount: { select: { accountNumber: true, userId: true } },
              toAccount: { select: { accountNumber: true, userId: true } },
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          }),
      this.prisma.payee.count({ where: { userId } }),
    ]);

    const totals = new Map<Currency, { cents: number; accounts: number }>();
    for (const account of accounts) {
      const entry = totals.get(account.currency) ?? { cents: 0, accounts: 0 };
      entry.cents += toCents(account.balance.toString());
      entry.accounts += 1;
      totals.set(account.currency, entry);
    }

    const month = new Map<Currency, { incoming: number; outgoing: number }>();
    const series = new Map<Currency, Map<string, { incoming: number; outgoing: number }>>();
    const days: string[] = [];
    for (let index = 0; index < SERIES_DAYS; index += 1) {
      const day = new Date(seriesStart);
      day.setUTCDate(day.getUTCDate() + index);
      days.push(day.toISOString().slice(0, 10));
    }

    for (const transaction of transactions) {
      const outgoing = owned.has(transaction.fromAccountId);
      const bucket = outgoing ? 'outgoing' : 'incoming';
      const cents = toCents(transaction.amount.toString());
      const key = transaction.createdAt.toISOString().slice(0, 10);

      if (transaction.createdAt >= monthStart) {
        const entry = month.get(transaction.currency) ?? {
          incoming: 0,
          outgoing: 0,
        };
        entry[bucket] += cents;
        month.set(transaction.currency, entry);
      }

      const byDay =
        series.get(transaction.currency) ??
        new Map(days.map((day) => [day, { incoming: 0, outgoing: 0 }]));
      const point = byDay.get(key);
      if (point) point[bucket] += cents;
      series.set(transaction.currency, byDay);
    }

    const currencies = [...totals.keys()];

    return {
      totals: currencies.map((currency) => ({
        currency,
        balance: fromCents(totals.get(currency)!.cents),
        accounts: totals.get(currency)!.accounts,
      })),
      payeeCount,
      month: currencies.map((currency) => ({
        currency,
        incoming: fromCents(month.get(currency)?.incoming ?? 0),
        outgoing: fromCents(month.get(currency)?.outgoing ?? 0),
      })),
      series: currencies.map((currency) => ({
        currency,
        points: days.map((day) => ({
          date: day,
          incoming: fromCents(series.get(currency)?.get(day)?.incoming ?? 0),
          outgoing: fromCents(series.get(currency)?.get(day)?.outgoing ?? 0),
        })),
      })),
      recent: transactions.slice(0, RECENT_LIMIT).map((transaction) =>
        toRecent(transaction, owned),
      ),
    };
  }
}

function toRecent(
  transaction: TransactionWithAccounts,
  owned: Set<string>,
): RecentTransactionDto {
  const outgoing = owned.has(transaction.fromAccountId);
  return {
    id: transaction.id,
    reference: transaction.reference,
    direction: outgoing ? 'OUTGOING' : 'INCOMING',
    amount: transaction.amount.toString(),
    currency: transaction.currency,
    counterpartyAccountNumber: outgoing
      ? transaction.toAccount.accountNumber
      : transaction.fromAccount.accountNumber,
    accountId: outgoing
      ? transaction.fromAccountId
      : transaction.toAccountId,
    note: transaction.note,
    createdAt: transaction.createdAt.toISOString(),
  };
}

function toCents(amount: string): number {
  return Math.round(Number(amount) * 100);
}

function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}
