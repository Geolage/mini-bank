import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from './audit.service.js';

const log = {
  id: 'audit-1',
  actorId: 'user-1',
  action: 'TRANSFER_CREATED',
  resourceType: 'Transaction',
  resourceId: 'txn-1',
  metadata: { reference: 'TXN-1' },
  createdAt: new Date('2026-10-31T10:00:00.000Z'),
  actor: {
    id: 'user-1',
    name: 'Admin',
    email: 'admin@minibank.dev',
  },
};

describe('AuditService', () => {
  let findMany: ReturnType<typeof vi.fn>;
  let count: ReturnType<typeof vi.fn>;
  let service: AuditService;

  beforeEach(() => {
    findMany = vi.fn().mockResolvedValue([log]);
    count = vi.fn().mockResolvedValue(1);

    const prisma = {
      auditLog: { findMany, count },
      $transaction: vi.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    } as unknown as PrismaService;

    service = new AuditService(prisma);
  });

  it('returns a mapped page with defaults', async () => {
    const result = await service.list({ page: 1, pageSize: 20 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: 0,
        take: 20,
      }),
    );
    expect(result).toEqual({
      items: [
        {
          id: 'audit-1',
          actor: log.actor,
          action: 'TRANSFER_CREATED',
          resourceType: 'Transaction',
          resourceId: 'txn-1',
          metadata: { reference: 'TXN-1' },
          createdAt: '2026-10-31T10:00:00.000Z',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });
  });

  it('applies actor, action and date filters', async () => {
    await service.list({
      page: 3,
      pageSize: 10,
      actorId: 'user-1',
      action: 'TRANSFER_CREATED',
      from: '2026-10-01',
      to: '2026-10-31',
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          actorId: 'user-1',
          action: 'TRANSFER_CREATED',
          createdAt: {
            gte: new Date('2026-10-01T00:00:00.000Z'),
            lte: new Date('2026-10-31T23:59:59.999Z'),
          },
        },
        skip: 20,
        take: 10,
      }),
    );
  });

  it('rejects an inverted date range', async () => {
    await expect(
      service.list({
        page: 1,
        pageSize: 20,
        from: '2026-11-01',
        to: '2026-10-31',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns an empty page while keeping the total', async () => {
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(7);

    const result = await service.list({ page: 9, pageSize: 20 });

    expect(result).toEqual({ items: [], page: 9, pageSize: 20, total: 7 });
  });
});
