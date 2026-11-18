import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { PayeesService } from './payees.service.js';

const payee = {
  id: 'payee-1',
  userId: 'user-1',
  name: 'Visitor checking',
  accountNumber: 'MB-2001-0001',
  bankName: 'MiniBank',
  note: 'Dinner splits',
  createdAt: new Date('2026-11-05T08:00:00.000Z'),
  updatedAt: new Date('2026-11-05T09:00:00.000Z'),
};

describe('PayeesService', () => {
  let findMany: ReturnType<typeof vi.fn>;
  let count: ReturnType<typeof vi.fn>;
  let findFirst: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let remove: ReturnType<typeof vi.fn>;
  let auditCreate: ReturnType<typeof vi.fn>;
  let service: PayeesService;

  beforeEach(() => {
    findMany = vi.fn().mockResolvedValue([payee]);
    count = vi.fn().mockResolvedValue(1);
    findFirst = vi.fn().mockResolvedValue(payee);
    create = vi.fn().mockResolvedValue(payee);
    update = vi.fn().mockResolvedValue(payee);
    remove = vi.fn().mockResolvedValue(payee);
    auditCreate = vi.fn().mockResolvedValue({});

    const prisma = {
      payee: { findMany, count, findFirst, create, update, delete: remove },
      auditLog: { create: auditCreate },
      $transaction: vi.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    } as unknown as PrismaService;

    service = new PayeesService(prisma);
  });

  it('lists only the caller’s payees with search, sort and pagination', async () => {
    const result = await service.list('user-1', {
      page: 2,
      pageSize: 10,
      q: 'visitor',
      sort: 'updated',
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          OR: [
            { name: { contains: 'visitor', mode: 'insensitive' } },
            { accountNumber: { contains: 'visitor', mode: 'insensitive' } },
            { bankName: { contains: 'visitor', mode: 'insensitive' } },
          ],
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: 10,
        take: 10,
      }),
    );
    expect(result).toEqual({
      items: [
        {
          id: 'payee-1',
          name: 'Visitor checking',
          accountNumber: 'MB-2001-0001',
          bankName: 'MiniBank',
          note: 'Dinner splits',
          createdAt: '2026-11-05T08:00:00.000Z',
          updatedAt: '2026-11-05T09:00:00.000Z',
        },
      ],
      page: 2,
      pageSize: 10,
      total: 1,
    });
  });

  it('trims input, defaults the bank and audits the creation', async () => {
    await service.create('user-1', {
      name: '  Visitor checking  ',
      accountNumber: 'MB-2001-0001',
      note: '  ',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        name: 'Visitor checking',
        accountNumber: 'MB-2001-0001',
        bankName: 'MiniBank',
        note: null,
      },
    });
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'user-1',
          action: 'PAYEE_CREATED',
          resourceType: 'Payee',
        }),
      }),
    );
  });

  it('turns a duplicate account number into a conflict', async () => {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '6.0.0',
      }),
    );

    await expect(
      service.create('user-1', {
        name: 'Dup',
        accountNumber: 'MB-2001-0001',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses to touch a payee owned by someone else', async () => {
    findFirst.mockResolvedValue(null);

    await expect(
      service.update('user-2', 'payee-1', { name: 'Nope' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove('user-2', 'payee-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('returns the removed payee so the client can offer undo', async () => {
    const result = await service.remove('user-1', 'payee-1');

    expect(remove).toHaveBeenCalledWith({ where: { id: 'payee-1' } });
    expect(result.id).toBe('payee-1');
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'PAYEE_DELETED' }),
      }),
    );
  });
});
