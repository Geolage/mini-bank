import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Currency, Prisma, TransactionStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { ListTransactionsQueryDto } from './dto/list-transactions-query.dto.js';
import { TransactionDirection } from './types/transaction-direction.js';
import { TransactionsService } from './transactions.service.js';

const userId = 'user-1';
const accountId = 'account-1';
const otherAccountId = 'account-2';

const transaction = {
  id: 'txn-1',
  reference: 'SEED-TXN-001',
  fromAccountId: accountId,
  toAccountId: otherAccountId,
  amount: new Prisma.Decimal('250.00'),
  currency: Currency.USD,
  status: TransactionStatus.COMPLETED,
  idempotencyKey: 'idem-1',
  note: 'Dinner split',
  createdAt: new Date('2026-10-31T10:00:00.000Z'),
};

function query(
  overrides: Partial<ListTransactionsQueryDto> = {},
): ListTransactionsQueryDto {
  return { page: 1, pageSize: 20, ...overrides };
}

describe('TransactionsService', () => {
  let accountFindFirst: ReturnType<typeof vi.fn>;
  let transactionFindMany: ReturnType<typeof vi.fn>;
  let transactionCount: ReturnType<typeof vi.fn>;
  let runTransaction: ReturnType<typeof vi.fn>;
  let service: TransactionsService;

  beforeEach(() => {
    accountFindFirst = vi.fn().mockResolvedValue({ id: accountId });
    transactionFindMany = vi.fn().mockResolvedValue([transaction]);
    transactionCount = vi.fn().mockResolvedValue(1);
    runTransaction = vi.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );

    const prisma = {
      account: { findFirst: accountFindFirst },
      transaction: {
        findMany: transactionFindMany,
        count: transactionCount,
      },
      $transaction: runTransaction,
    } as unknown as PrismaService;

    service = new TransactionsService(prisma);
  });

  it('rejects accounts owned by another user', async () => {
    accountFindFirst.mockResolvedValue(null);

    await expect(
      service.listForAccount(userId, accountId, query()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it('returns a mapped page with a stable order', async () => {
    const result = await service.listForAccount(
      userId,
      accountId,
      query({ page: 2, pageSize: 1 }),
    );

    expect(accountFindFirst).toHaveBeenCalledWith({
      where: { id: accountId, userId },
      select: { id: true },
    });
    expect(transactionFindMany).toHaveBeenCalledWith({
      where: {
        OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: 1,
      take: 1,
    });
    expect(transactionCount).toHaveBeenCalledWith({
      where: {
        OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
      },
    });
    expect(result).toEqual({
      items: [
        {
          id: 'txn-1',
          reference: 'SEED-TXN-001',
          fromAccountId: accountId,
          toAccountId: otherAccountId,
          amount: '250.00',
          currency: Currency.USD,
          status: TransactionStatus.COMPLETED,
          note: 'Dinner split',
          createdAt: '2026-10-31T10:00:00.000Z',
        },
      ],
      page: 2,
      pageSize: 1,
      total: 1,
    });
  });

  it('filters outgoing transactions by date', async () => {
    await service.listForAccount(
      userId,
      accountId,
      query({
        type: TransactionDirection.OUTGOING,
        from: '2026-10-01',
        to: '2026-10-31',
      }),
    );

    expect(transactionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          fromAccountId: accountId,
          createdAt: {
            gte: new Date('2026-10-01T00:00:00.000Z'),
            lte: new Date('2026-10-31T23:59:59.999Z'),
          },
        },
      }),
    );
  });

  it('filters incoming transactions', async () => {
    await service.listForAccount(
      userId,
      accountId,
      query({ type: TransactionDirection.INCOMING }),
    );

    expect(transactionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { toAccountId: accountId },
      }),
    );
  });

  it('returns an empty page while keeping the total', async () => {
    transactionFindMany.mockResolvedValue([]);
    transactionCount.mockResolvedValue(6);

    const result = await service.listForAccount(
      userId,
      accountId,
      query({ page: 5, pageSize: 10 }),
    );

    expect(result).toEqual({
      items: [],
      page: 5,
      pageSize: 10,
      total: 6,
    });
  });

  it('rejects an inverted date range', async () => {
    await expect(
      service.listForAccount(
        userId,
        accountId,
        query({ from: '2026-11-01', to: '2026-10-31' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(runTransaction).not.toHaveBeenCalled();
  });
});
