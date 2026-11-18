import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Currency, Prisma, TransactionStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTransferDto } from './dto/create-transfer.dto.js';
import { TransfersService } from './transfers.service.js';

const userId = 'user-1';
const sourceId = 'account-1';
const targetId = 'account-2';
const idempotencyKey = '2f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69';

const sourceAccount = {
  id: sourceId,
  userId,
  accountNumber: 'MB-1001-0001',
  type: 'CHECKING' as const,
  currency: Currency.USD,
  balance: new Prisma.Decimal('12500.00'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const targetAccount = {
  ...sourceAccount,
  id: targetId,
  accountNumber: 'MB-2001-0001',
};

const existingTransaction = {
  id: 'txn-existing',
  reference: 'TXN-existing',
  fromAccountId: sourceId,
  toAccountId: targetId,
  amount: new Prisma.Decimal('100.00'),
  currency: Currency.USD,
  status: TransactionStatus.COMPLETED,
  idempotencyKey,
  note: null,
  createdAt: new Date(),
};

function dto(overrides: Partial<CreateTransferDto> = {}): CreateTransferDto {
  return {
    fromAccountId: sourceId,
    toAccountNumber: 'MB-2001-0001',
    amount: '100.00',
    ...overrides,
  };
}

type MockFn = ReturnType<typeof vi.fn>;

describe('TransfersService', () => {
  let tx: {
    account: {
      findFirst: MockFn;
      findUnique: MockFn;
      findMany: MockFn;
      update: MockFn;
    };
    transaction: { findUnique: MockFn; create: MockFn };
    auditLog: { create: MockFn };
    $queryRaw: MockFn;
  };
  let prismaMock: {
    $transaction: MockFn;
    account: { findFirst: MockFn };
    transaction: { findUnique: MockFn };
  };
  let service: TransfersService;

  beforeEach(() => {
    tx = {
      account: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      transaction: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'txn-new', reference: 'TXN-new' }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit-new' }),
      },
      $queryRaw: vi.fn().mockResolvedValue([]),
    };

    prismaMock = {
      $transaction: vi.fn((callback: (client: unknown) => Promise<unknown>) =>
        callback(tx),
      ),
      account: { findFirst: vi.fn() },
      transaction: { findUnique: vi.fn() },
    };

    service = new TransfersService(prismaMock as unknown as PrismaService);
  });

  it('requires a UUID idempotency key', async () => {
    await expect(service.create(userId, dto(), undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.create(userId, dto(), 'not-a-uuid')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tx.account.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a non-positive amount', async () => {
    await expect(
      service.create(userId, dto({ amount: '0.00' }), idempotencyKey),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('replays an existing transfer without moving money', async () => {
    tx.transaction.findUnique.mockResolvedValue(existingTransaction);
    tx.account.findFirst.mockResolvedValue({ id: sourceId });

    const result = await service.create(userId, dto(), idempotencyKey);

    expect(result).toEqual({
      id: 'txn-existing',
      reference: 'TXN-existing',
    });
    expect(tx.account.update).not.toHaveBeenCalled();
    expect(tx.transaction.create).not.toHaveBeenCalled();
  });

  it('rejects an idempotency key owned by another user', async () => {
    tx.transaction.findUnique.mockResolvedValue(existingTransaction);
    tx.account.findFirst.mockResolvedValue(null);

    await expect(service.create(userId, dto(), idempotencyKey)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('creates an atomic transfer with locks and an audit entry', async () => {
    tx.account.findFirst.mockResolvedValue(sourceAccount);
    tx.account.findUnique.mockResolvedValue(targetAccount);
    tx.account.findMany.mockResolvedValue([sourceAccount, targetAccount]);

    const result = await service.create(userId, dto({ note: 'Rent' }), idempotencyKey);

    expect(result.id).toBe('txn-new');
    expect(result.reference).toMatch(/^TXN-/);
    expect(tx.account.findFirst).toHaveBeenCalledWith({
      where: { id: sourceId, userId },
    });
    expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
    expect(tx.account.update).toHaveBeenNthCalledWith(1, {
      where: { id: sourceId },
      data: { balance: { decrement: new Prisma.Decimal('100.00') } },
    });
    expect(tx.account.update).toHaveBeenNthCalledWith(2, {
      where: { id: targetId },
      data: { balance: { increment: new Prisma.Decimal('100.00') } },
    });
    expect(tx.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromAccountId: sourceId,
          toAccountId: targetId,
          currency: Currency.USD,
          status: TransactionStatus.COMPLETED,
          idempotencyKey,
          note: 'Rent',
        }),
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: userId,
          action: 'TRANSFER_CREATED',
          resourceType: 'Transaction',
        }),
      }),
    );
  });

  it('rejects same-account and currency-mismatch transfers', async () => {
    tx.account.findFirst.mockResolvedValue(sourceAccount);
    tx.account.findUnique.mockResolvedValue({ ...targetAccount, id: sourceId });

    await expect(service.create(userId, dto(), idempotencyKey)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    tx.account.findUnique.mockResolvedValue({
      ...targetAccount,
      currency: Currency.HKD,
    });

    await expect(service.create(userId, dto(), idempotencyKey)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tx.account.update).not.toHaveBeenCalled();
  });

  it('rejects insufficient funds after locking', async () => {
    tx.account.findFirst.mockResolvedValue(sourceAccount);
    tx.account.findUnique.mockResolvedValue(targetAccount);
    tx.account.findMany.mockResolvedValue([
      { ...sourceAccount, balance: new Prisma.Decimal('50.00') },
      targetAccount,
    ]);

    await expect(service.create(userId, dto(), idempotencyKey)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tx.account.update).not.toHaveBeenCalled();
  });

  it('returns 404 when source or destination is missing', async () => {
    tx.account.findFirst.mockResolvedValue(null);
    await expect(service.create(userId, dto(), idempotencyKey)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    tx.account.findFirst.mockResolvedValue(sourceAccount);
    tx.account.findUnique.mockResolvedValue(null);
    await expect(service.create(userId, dto(), idempotencyKey)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('replays a concurrent idempotency conflict', async () => {
    prismaMock.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.19.3',
        meta: { target: ['idempotency_key'] },
      }),
    );
    prismaMock.transaction.findUnique.mockResolvedValue(existingTransaction);
    prismaMock.account.findFirst.mockResolvedValue({ id: sourceId });

    const result = await service.create(userId, dto(), idempotencyKey);

    expect(result).toEqual({
      id: 'txn-existing',
      reference: 'TXN-existing',
    });
  });
});
