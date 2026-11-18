import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { DashboardService } from './dashboard.service.js';

function daysAgo(count: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - count);
  date.setUTCHours(12, 0, 0, 0);
  return date;
}

const usd = {
  id: 'acc-usd',
  userId: 'user-1',
  accountNumber: 'MB-1001-0001',
  currency: 'USD',
  balance: { toString: () => '12500.00' },
};
const hkd = {
  id: 'acc-hkd',
  userId: 'user-1',
  accountNumber: 'MB-1001-0002',
  currency: 'HKD',
  balance: { toString: () => '48000.00' },
};

function transaction(
  id: string,
  from: typeof usd,
  to: typeof usd,
  amount: string,
  createdAt: Date,
) {
  return {
    id,
    reference: `TXN-${id}`,
    fromAccountId: from.id,
    toAccountId: to.id,
    amount: { toString: () => amount },
    currency: from.currency,
    note: null,
    createdAt,
    fromAccount: { accountNumber: from.accountNumber, userId: from.userId },
    toAccount: { accountNumber: to.accountNumber, userId: to.userId },
  };
}

const visitorUsd = { ...usd, id: 'acc-visitor', userId: 'user-2', accountNumber: 'MB-2001-0001' };

describe('DashboardService', () => {
  let findAccounts: ReturnType<typeof vi.fn>;
  let findTransactions: ReturnType<typeof vi.fn>;
  let countPayees: ReturnType<typeof vi.fn>;
  let service: DashboardService;

  beforeEach(() => {
    findAccounts = vi.fn().mockResolvedValue([usd, hkd]);
    findTransactions = vi.fn().mockResolvedValue([
      transaction('t1', usd, visitorUsd, '42.00', daysAgo(0)),
      transaction('t2', visitorUsd, usd, '18.75', daysAgo(0)),
      transaction('t3', usd, visitorUsd, '250.00', daysAgo(3)),
    ]);
    countPayees = vi.fn().mockResolvedValue(2);

    const prisma = {
      account: { findMany: findAccounts },
      transaction: { findMany: findTransactions },
      payee: { count: countPayees },
    } as unknown as PrismaService;

    service = new DashboardService(prisma);
  });

  it('sums balances per currency without mixing them', async () => {
    const overview = await service.overview('user-1');

    expect(overview.totals).toEqual([
      { currency: 'USD', balance: '12500.00', accounts: 1 },
      { currency: 'HKD', balance: '48000.00', accounts: 1 },
    ]);
    expect(overview.payeeCount).toBe(2);
  });

  it('splits month flows by direction relative to the owner', async () => {
    const overview = await service.overview('user-1');

    expect(overview.month).toEqual([
      { currency: 'USD', incoming: '18.75', outgoing: '292.00' },
      { currency: 'HKD', incoming: '0.00', outgoing: '0.00' },
    ]);
  });

  it('returns a zero-filled 30 day series per currency', async () => {
    const overview = await service.overview('user-1');
    const usdSeries = overview.series.find((entry) => entry.currency === 'USD')!;

    expect(usdSeries.points).toHaveLength(30);
    const today = usdSeries.points[29];
    expect(today.incoming).toBe('18.75');
    expect(today.outgoing).toBe('42.00');
    expect(usdSeries.points[26].outgoing).toBe('250.00');
    expect(usdSeries.points[0]).toEqual({
      date: expect.any(String),
      incoming: '0.00',
      outgoing: '0.00',
    });
  });

  it('labels recent activity with the counterparty account', async () => {
    const overview = await service.overview('user-1');

    expect(overview.recent[0]).toMatchObject({
      reference: 'TXN-t1',
      direction: 'OUTGOING',
      counterpartyAccountNumber: 'MB-2001-0001',
      accountId: 'acc-usd',
    });
    expect(overview.recent[1].direction).toBe('INCOMING');
    expect(overview.recent).toHaveLength(3);
  });

  it('handles a customer with no accounts', async () => {
    findAccounts.mockResolvedValue([]);

    const overview = await service.overview('user-1');

    expect(overview.totals).toEqual([]);
    expect(overview.series).toEqual([]);
    expect(overview.recent).toEqual([]);
    expect(findTransactions).not.toHaveBeenCalled();
  });
});
