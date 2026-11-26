import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountType,
  Currency,
  Prisma,
  Role,
  TransferOrderStatus,
} from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { TransferLedgerService } from '../transfers/transfer-ledger.service.js';
import { TransferOrdersService } from './transfer-orders.service.js';

const makerId = 'maker-1';
const checkerId = 'checker-1';
const orderId = '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69';
const fromAccountId = 'account-1';
const toAccountId = 'account-2';

const sourceAccount = {
  id: fromAccountId,
  userId: makerId,
  accountNumber: 'MB-1001-0001',
  type: AccountType.CHECKING,
  currency: Currency.USD,
  balance: new Prisma.Decimal('12500.00'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const targetAccount = {
  ...sourceAccount,
  id: toAccountId,
  accountNumber: 'MB-2001-0001',
};

const pendingOrder = {
  id: orderId,
  reference: 'ORD-1',
  idempotencyKey: 'key-1',
  makerId,
  checkerId: null,
  fromAccountId,
  toAccountId,
  amount: new Prisma.Decimal('10000.00'),
  currency: Currency.USD,
  note: 'Invoice 42',
  status: TransferOrderStatus.PENDING,
  decisionNote: null,
  decidedAt: null,
  transactionId: null,
  createdAt: new Date('2026-11-19T10:00:00.000Z'),
};

const orderWithRelations = {
  ...pendingOrder,
  maker: { id: makerId, name: 'Admin', username: 'admin' },
  checker: null,
  fromAccount: {
    id: fromAccountId,
    accountNumber: 'MB-1001-0001',
    type: AccountType.CHECKING,
  },
  toAccount: {
    id: toAccountId,
    accountNumber: 'MB-2001-0001',
    type: AccountType.CHECKING,
  },
};

type MockFn = ReturnType<typeof vi.fn>;

describe('TransferOrdersService', () => {
  let tx: {
    transferOrder: { findUnique: MockFn; update: MockFn };
    account: { findMany: MockFn; update: MockFn };
    transaction: { create: MockFn };
    auditLog: { create: MockFn };
    $queryRaw: MockFn;
  };
  let prismaMock: {
    $transaction: MockFn;
    transferOrder: { findMany: MockFn; count: MockFn };
  };
  let service: TransferOrdersService;

  beforeEach(() => {
    tx = {
      transferOrder: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
      },
      account: {
        findMany: vi.fn().mockResolvedValue([sourceAccount, targetAccount]),
        update: vi.fn().mockResolvedValue({}),
      },
      transaction: {
        create: vi.fn().mockResolvedValue({ id: 'txn-1', reference: 'TXN-1' }),
      },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
      $queryRaw: vi.fn().mockResolvedValue([]),
    };

    prismaMock = {
      $transaction: vi.fn((arg: unknown) =>
        Array.isArray(arg)
          ? Promise.all(arg)
          : (arg as (client: unknown) => Promise<unknown>)(tx),
      ),
      transferOrder: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    };

    service = new TransferOrdersService(
      prismaMock as unknown as PrismaService,
      new TransferLedgerService(),
    );
  });

  it('scopes operator lists to their own orders and maps the DTO', async () => {
    prismaMock.transferOrder.findMany.mockResolvedValue([orderWithRelations]);
    prismaMock.transferOrder.count.mockResolvedValue(1);

    const result = await service.list(makerId, Role.OPERATOR, {
      page: 1,
      pageSize: 20,
    });

    expect(prismaMock.transferOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { makerId } }),
    );
    expect(result).toEqual({
      items: [
        {
          id: orderId,
          reference: 'ORD-1',
          status: TransferOrderStatus.PENDING,
          amount: '10000.00',
          currency: Currency.USD,
          note: 'Invoice 42',
          createdAt: '2026-11-19T10:00:00.000Z',
          decidedAt: null,
          decisionNote: null,
          maker: { id: makerId, name: 'Admin', username: 'admin' },
          checker: null,
          fromAccount: {
            id: fromAccountId,
            accountNumber: 'MB-1001-0001',
            type: AccountType.CHECKING,
          },
          toAccount: {
            id: toAccountId,
            accountNumber: 'MB-2001-0001',
            type: AccountType.CHECKING,
          },
          transactionId: null,
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });
  });

  it('does not scope checker lists to the checker', async () => {
    await service.list(checkerId, Role.CHECKER, {
      page: 2,
      pageSize: 10,
      status: TransferOrderStatus.PENDING,
    });

    expect(prismaMock.transferOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: TransferOrderStatus.PENDING },
      }),
    );
  });

  it('approves a pending order by posting the ledger entry', async () => {
    tx.transferOrder.findUnique.mockResolvedValue(pendingOrder);

    const result = await service.approve(checkerId, orderId, {});

    expect(result).toEqual({
      id: 'txn-1',
      reference: expect.stringMatching(/^TXN-/),
      status: 'COMPLETED',
    });
    expect(tx.$queryRaw).toHaveBeenCalledTimes(3);
    expect(tx.account.update).toHaveBeenNthCalledWith(1, {
      where: { id: fromAccountId },
      data: { balance: { decrement: pendingOrder.amount } },
    });
    expect(tx.account.update).toHaveBeenNthCalledWith(2, {
      where: { id: toAccountId },
      data: { balance: { increment: pendingOrder.amount } },
    });
    expect(tx.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currency: Currency.USD,
          idempotencyKey: `approval:${orderId}`,
          note: 'Invoice 42',
        }),
      }),
    );
    expect(tx.transferOrder.update).toHaveBeenCalledWith({
      where: { id: orderId },
      data: expect.objectContaining({
        status: TransferOrderStatus.APPROVED,
        checkerId,
        decidedAt: expect.any(Date),
        transactionId: 'txn-1',
      }),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: checkerId,
          action: 'TRANSFER_ORDER_APPROVED',
          resourceType: 'TransferOrder',
          resourceId: orderId,
        }),
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: checkerId,
          action: 'TRANSFER_CREATED',
          metadata: expect.objectContaining({ orderId }),
        }),
      }),
    );
  });

  it('leaves the order pending when approval finds insufficient funds', async () => {
    tx.transferOrder.findUnique.mockResolvedValue(pendingOrder);
    tx.account.findMany.mockResolvedValue([
      { ...sourceAccount, balance: new Prisma.Decimal('100.00') },
      targetAccount,
    ]);

    await expect(
      service.approve(checkerId, orderId, {}),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.transferOrder.update).not.toHaveBeenCalled();
    expect(tx.transaction.create).not.toHaveBeenCalled();
  });

  it('refuses to approve an order that is no longer pending', async () => {
    tx.transferOrder.findUnique.mockResolvedValue({
      ...pendingOrder,
      status: TransferOrderStatus.APPROVED,
    });

    await expect(
      service.approve(checkerId, orderId, {}),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.transferOrder.update).not.toHaveBeenCalled();
  });

  it('forbids approving your own order', async () => {
    tx.transferOrder.findUnique.mockResolvedValue({
      ...pendingOrder,
      makerId: checkerId,
    });

    await expect(
      service.approve(checkerId, orderId, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects an order with a trimmed reason', async () => {
    tx.transferOrder.findUnique.mockResolvedValue(pendingOrder);

    const result = await service.reject(checkerId, orderId, {
      decisionNote: ' Missing invoice ',
    });

    expect(result).toEqual({
      id: orderId,
      reference: 'ORD-1',
      status: 'REJECTED',
    });
    expect(tx.transferOrder.update).toHaveBeenCalledWith({
      where: { id: orderId },
      data: expect.objectContaining({
        status: TransferOrderStatus.REJECTED,
        checkerId,
        decisionNote: 'Missing invoice',
        decidedAt: expect.any(Date),
      }),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'TRANSFER_ORDER_REJECTED',
          resourceType: 'TransferOrder',
        }),
      }),
    );
  });

  it('lets the maker cancel a pending order', async () => {
    tx.transferOrder.findUnique.mockResolvedValue(pendingOrder);

    const result = await service.cancel(makerId, orderId);

    expect(result).toEqual({
      id: orderId,
      reference: 'ORD-1',
      status: 'CANCELLED',
    });
    expect(tx.transferOrder.update).toHaveBeenCalledWith({
      where: { id: orderId },
      data: expect.objectContaining({
        status: TransferOrderStatus.CANCELLED,
        decidedAt: expect.any(Date),
      }),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'TRANSFER_ORDER_CANCELLED',
        }),
      }),
    );
  });

  it('forbids cancelling someone else’s order', async () => {
    tx.transferOrder.findUnique.mockResolvedValue(pendingOrder);

    await expect(
      service.cancel('another-user', orderId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns 404 for unknown orders', async () => {
    tx.transferOrder.findUnique.mockResolvedValue(null);

    await expect(service.cancel(makerId, orderId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
