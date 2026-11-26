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
import { TransferOrdersController } from '../src/transfer-orders/transfer-orders.controller.js';
import { TransferOrdersService } from '../src/transfer-orders/transfer-orders.service.js';

const orderId = '3f2b8c1a-8d4e-4b6f-9a0c-1e2d3c4b5a69';

describe('transfer orders (e2e)', () => {
  let app: INestApplication;
  let role: Role = 'CHECKER';
  let list: ReturnType<typeof vi.fn>;
  let approve: ReturnType<typeof vi.fn>;
  let reject: ReturnType<typeof vi.fn>;
  let cancel: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    list = vi.fn().mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });
    approve = vi.fn().mockResolvedValue({
      id: 'txn-1',
      reference: 'TXN-1',
      status: 'COMPLETED',
    });
    reject = vi.fn().mockResolvedValue({
      id: orderId,
      reference: 'ORD-1',
      status: 'REJECTED',
    });
    cancel = vi.fn().mockResolvedValue({
      id: orderId,
      reference: 'ORD-1',
      status: 'CANCELLED',
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [TransferOrdersController],
      providers: [
        RolesGuard,
        Reflector,
        {
          provide: TransferOrdersService,
          useValue: { list, approve, reject, cancel },
        },
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
    role = 'CHECKER';
    list.mockClear();
    approve.mockClear();
    reject.mockClear();
    cancel.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets an operator list only their own orders', async () => {
    role = 'OPERATOR';

    await request(app.getHttpServer())
      .get('/transfer-orders?status=PENDING')
      .expect(200);

    expect(list).toHaveBeenCalledWith(
      'user-1',
      'OPERATOR',
      expect.objectContaining({ status: 'PENDING', page: 1, pageSize: 20 }),
    );
  });

  it('lets a checker list every order', async () => {
    await request(app.getHttpServer()).get('/transfer-orders').expect(200);

    expect(list).toHaveBeenCalledWith(
      'user-1',
      'CHECKER',
      expect.objectContaining({ page: 1, pageSize: 20 }),
    );
  });

  it('forbids viewers', async () => {
    role = 'VIEWER';

    await request(app.getHttpServer()).get('/transfer-orders').expect(403);

    expect(list).not.toHaveBeenCalled();
  });

  it('forbids operators from approving', async () => {
    role = 'OPERATOR';

    await request(app.getHttpServer())
      .post(`/transfer-orders/${orderId}/approve`)
      .send({})
      .expect(403);

    expect(approve).not.toHaveBeenCalled();
  });

  it('lets a checker approve with an optional note', async () => {
    await request(app.getHttpServer())
      .post(`/transfer-orders/${orderId}/approve`)
      .send({ decisionNote: 'Checked invoice' })
      .expect(201);

    expect(approve).toHaveBeenCalledWith(
      'user-1',
      orderId,
      expect.objectContaining({ decisionNote: 'Checked invoice' }),
    );
  });

  it('rejects a note longer than 200 characters', async () => {
    await request(app.getHttpServer())
      .post(`/transfer-orders/${orderId}/approve`)
      .send({ decisionNote: 'x'.repeat(201) })
      .expect(400);

    expect(approve).not.toHaveBeenCalled();
  });

  it('requires a reason when rejecting', async () => {
    await request(app.getHttpServer())
      .post(`/transfer-orders/${orderId}/reject`)
      .send({})
      .expect(400);

    expect(reject).not.toHaveBeenCalled();
  });

  it('lets a checker reject with a reason', async () => {
    await request(app.getHttpServer())
      .post(`/transfer-orders/${orderId}/reject`)
      .send({ decisionNote: 'Missing invoice' })
      .expect(201);

    expect(reject).toHaveBeenCalledWith(
      'user-1',
      orderId,
      expect.objectContaining({ decisionNote: 'Missing invoice' }),
    );
  });

  it('lets the operator cancel a valid order id', async () => {
    role = 'OPERATOR';

    await request(app.getHttpServer())
      .post(`/transfer-orders/${orderId}/cancel`)
      .expect(201);

    expect(cancel).toHaveBeenCalledWith('user-1', orderId);
  });

  it('validates ids and forbids checkers from cancelling', async () => {
    role = 'OPERATOR';

    await request(app.getHttpServer())
      .post('/transfer-orders/not-a-uuid/cancel')
      .expect(400);

    role = 'CHECKER';

    await request(app.getHttpServer())
      .post(`/transfer-orders/${orderId}/cancel`)
      .expect(403);

    expect(cancel).not.toHaveBeenCalled();
  });
});
