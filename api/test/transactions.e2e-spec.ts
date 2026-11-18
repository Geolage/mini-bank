import {
  ValidationPipe,
  type ExecutionContext,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Currency, Prisma, TransactionStatus } from '@prisma/client';
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
import { PrismaService } from '../src/prisma/prisma.service.js';
import { TransactionsController } from '../src/transactions/transactions.controller.js';
import { TransactionsService } from '../src/transactions/transactions.service.js';

const accountId = '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69';
const otherAccountId = '9a0c1e2d-3c4b-5a69-8d4e-4b6f3f2b8c1a';

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

describe('GET /accounts/:accountId/transactions (e2e)', () => {
  let app: INestApplication;
  let accountFindFirst: ReturnType<typeof vi.fn>;
  let transactionFindMany: ReturnType<typeof vi.fn>;
  let transactionCount: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    accountFindFirst = vi.fn();
    transactionFindMany = vi.fn();
    transactionCount = vi.fn();

    const prisma = {
      account: { findFirst: accountFindFirst },
      transaction: {
        findMany: transactionFindMany,
        count: transactionCount,
      },
      $transaction: vi.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = {
            id: 'user-1',
            role: 'VIEWER',
          };
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
    vi.clearAllMocks();
    accountFindFirst.mockResolvedValue({ id: accountId });
    transactionFindMany.mockResolvedValue([transaction]);
    transactionCount.mockResolvedValue(1);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a mapped page with a stable order', async () => {
    const response = await request(app.getHttpServer())
      .get(`/accounts/${accountId}/transactions?page=2&pageSize=1`)
      .expect(200);

    expect(response.body).toEqual({
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
    expect(transactionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: 1,
        take: 1,
      }),
    );
  });

  it('uses page defaults when pagination is omitted', async () => {
    const response = await request(app.getHttpServer())
      .get(`/accounts/${accountId}/transactions`)
      .expect(200);

    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(20);
    expect(transactionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
  });

  it('parses direction and date filters', async () => {
    await request(app.getHttpServer())
      .get(
        `/accounts/${accountId}/transactions?type=OUTGOING&from=2026-10-01&to=2026-10-31`,
      )
      .expect(200);

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

  it('rejects page sizes above the limit', async () => {
    await request(app.getHttpServer())
      .get(`/accounts/${accountId}/transactions?pageSize=101`)
      .expect(400);
  });

  it('rejects pages below 1', async () => {
    await request(app.getHttpServer())
      .get(`/accounts/${accountId}/transactions?page=0`)
      .expect(400);
  });

  it('rejects an unknown direction', async () => {
    await request(app.getHttpServer())
      .get(`/accounts/${accountId}/transactions?type=SIDEWAYS`)
      .expect(400);
  });

  it('returns 404 for an account owned by another user', async () => {
    accountFindFirst.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get(`/accounts/${accountId}/transactions`)
      .expect(404);
  });

  it('rejects an invalid account id', async () => {
    await request(app.getHttpServer())
      .get('/accounts/not-a-uuid/transactions')
      .expect(400);
  });
});
