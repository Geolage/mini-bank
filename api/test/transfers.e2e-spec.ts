import {
  ValidationPipe,
  type ExecutionContext,
  type INestApplication,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { Role } from '@prisma/client';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../src/common/guards/roles.guard.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { TransferLedgerService } from '../src/transfers/transfer-ledger.service.js';
import { TransfersController } from '../src/transfers/transfers.controller.js';
import { TransfersService } from '../src/transfers/transfers.service.js';

const idempotencyKey = '2f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69';

describe('POST /transfers (e2e)', () => {
  let app: INestApplication;
  let role: Role = 'OPERATOR';
  let transaction: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    transaction = vi.fn().mockResolvedValue({
      id: 'txn-1',
      reference: 'TXN-1',
      status: 'COMPLETED',
    });

    const prisma = {
      $transaction: transaction,
      account: { findFirst: vi.fn() },
      transaction: { findUnique: vi.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [TransfersController],
      providers: [
        TransfersService,
        TransferLedgerService,
        RolesGuard,
        Reflector,
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = { id: 'user-1', role };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    role = 'OPERATOR';
    transaction.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a transfer for an operator', async () => {
    const response = await request(app.getHttpServer())
      .post('/transfers')
      .set('Idempotency-Key', idempotencyKey)
      .send({
        fromAccountId: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69',
        toAccountNumber: 'MB-2001-0001',
        amount: '120.50',
        note: 'Rent share',
      })
      .expect(201);

    expect(response.body).toEqual({
      id: 'txn-1',
      reference: 'TXN-1',
      status: 'COMPLETED',
    });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('requires an idempotency key', async () => {
    await request(app.getHttpServer())
      .post('/transfers')
      .send({
        fromAccountId: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69',
        toAccountNumber: 'MB-2001-0001',
        amount: '120.50',
      })
      .expect(400);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects a non-UUID idempotency key', async () => {
    await request(app.getHttpServer())
      .post('/transfers')
      .set('Idempotency-Key', 'not-a-uuid')
      .send({
        fromAccountId: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69',
        toAccountNumber: 'MB-2001-0001',
        amount: '120.50',
      })
      .expect(400);
  });

  it('rejects a zero amount', async () => {
    await request(app.getHttpServer())
      .post('/transfers')
      .set('Idempotency-Key', idempotencyKey)
      .send({
        fromAccountId: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69',
        toAccountNumber: 'MB-2001-0001',
        amount: '0.00',
      })
      .expect(400);
  });

  it('rejects an invalid source account id', async () => {
    await request(app.getHttpServer())
      .post('/transfers')
      .set('Idempotency-Key', idempotencyKey)
      .send({
        fromAccountId: 'not-a-uuid',
        toAccountNumber: 'MB-2001-0001',
        amount: '120.50',
      })
      .expect(400);
  });

  it('forbids viewers', async () => {
    role = 'VIEWER';

    await request(app.getHttpServer())
      .post('/transfers')
      .set('Idempotency-Key', idempotencyKey)
      .send({
        fromAccountId: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69',
        toAccountNumber: 'MB-2001-0001',
        amount: '120.50',
      })
      .expect(403);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('forbids checkers from transferring', async () => {
    role = 'CHECKER';

    await request(app.getHttpServer())
      .post('/transfers')
      .set('Idempotency-Key', idempotencyKey)
      .send({
        fromAccountId: '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69',
        toAccountNumber: 'MB-2001-0001',
        amount: '120.50',
      })
      .expect(403);
    expect(transaction).not.toHaveBeenCalled();
  });
});
