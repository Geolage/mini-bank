import {
  ValidationPipe,
  type ExecutionContext,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { PayeesController } from '../src/payees/payees.controller.js';
import { PayeesService } from '../src/payees/payees.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const payee = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: 'user-1',
  name: 'Visitor checking',
  accountNumber: 'MB-2001-0001',
  bankName: 'MiniBank',
  note: null,
  createdAt: new Date('2026-11-05T08:00:00.000Z'),
  updatedAt: new Date('2026-11-05T08:00:00.000Z'),
};

describe('/payees (e2e)', () => {
  let app: INestApplication;
  let findMany: ReturnType<typeof vi.fn>;
  let count: ReturnType<typeof vi.fn>;
  let findFirst: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let remove: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    findMany = vi.fn();
    count = vi.fn();
    findFirst = vi.fn();
    create = vi.fn();
    update = vi.fn();
    remove = vi.fn();

    const prisma = {
      payee: { findMany, count, findFirst, create, update, delete: remove },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
      $transaction: vi.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [PayeesController],
      providers: [PayeesService, { provide: PrismaService, useValue: prisma }],
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
    findMany.mockReset().mockResolvedValue([payee]);
    count.mockReset().mockResolvedValue(1);
    findFirst.mockReset().mockResolvedValue(payee);
    create.mockReset().mockResolvedValue(payee);
    update.mockReset().mockResolvedValue(payee);
    remove.mockReset().mockResolvedValue(payee);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists payees for any authenticated role', async () => {
    const response = await request(app.getHttpServer())
      .get('/payees?q=visitor&sort=updated&page=1&pageSize=10')
      .expect(200);

    expect(response.body.total).toBe(1);
    expect(response.body.items[0].accountNumber).toBe('MB-2001-0001');
  });

  it('rejects an unknown sort value', async () => {
    await request(app.getHttpServer()).get('/payees?sort=bogus').expect(400);
  });

  it('creates a payee', async () => {
    const response = await request(app.getHttpServer())
      .post('/payees')
      .send({ name: 'Visitor checking', accountNumber: 'MB-2001-0001' })
      .expect(201);

    expect(response.body.id).toBe(payee.id);
  });

  it('rejects a malformed account number', async () => {
    await request(app.getHttpServer())
      .post('/payees')
      .send({ name: 'Bad', accountNumber: '12345' })
      .expect(400);
  });

  it('rejects unknown properties', async () => {
    await request(app.getHttpServer())
      .post('/payees')
      .send({
        name: 'Bad',
        accountNumber: 'MB-2001-0001',
        isAdmin: true,
      })
      .expect(400);
  });

  it('reports a duplicate account number as a conflict', async () => {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '6.0.0',
      }),
    );

    await request(app.getHttpServer())
      .post('/payees')
      .send({ name: 'Dup', accountNumber: 'MB-2001-0001' })
      .expect(409);
  });

  it('updates a payee', async () => {
    await request(app.getHttpServer())
      .patch(`/payees/${payee.id}`)
      .send({ note: 'Rent share' })
      .expect(200);

    expect(update).toHaveBeenCalled();
  });

  it('404s when the payee belongs to another user', async () => {
    findFirst.mockResolvedValue(null);

    await request(app.getHttpServer())
      .patch(`/payees/${payee.id}`)
      .send({ name: 'Nope' })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/payees/${payee.id}`)
      .expect(404);
  });

  it('deletes a payee and returns it for undo', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/payees/${payee.id}`)
      .expect(200);

    expect(response.body.accountNumber).toBe('MB-2001-0001');
  });
});
