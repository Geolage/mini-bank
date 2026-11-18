import {
  ValidationPipe,
  type ExecutionContext,
  type INestApplication,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { Role } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditController } from '../src/audit/audit.controller.js';
import { AuditService } from '../src/audit/audit.service.js';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../src/common/guards/roles.guard.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

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
    name: 'Alex Chen',
    email: 'operator@minibank.dev',
  },
};

describe('GET /audit-logs (e2e)', () => {
  let app: INestApplication;
  let role: Role = 'OPERATOR';
  let findMany: ReturnType<typeof vi.fn>;
  let count: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    findMany = vi.fn().mockResolvedValue([log]);
    count = vi.fn().mockResolvedValue(1);

    const prisma = {
      auditLog: { findMany, count },
      $transaction: vi.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        AuditService,
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
    findMany.mockClear();
    count.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a paginated list for operators', async () => {
    const response = await request(app.getHttpServer())
      .get('/audit-logs?action=TRANSFER_CREATED&page=2&pageSize=10')
      .expect(200);

    expect(response.body).toEqual({
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
      page: 2,
      pageSize: 10,
      total: 1,
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { action: 'TRANSFER_CREATED' },
        skip: 10,
        take: 10,
      }),
    );
  });

  it('rejects page sizes above the limit', async () => {
    await request(app.getHttpServer()).get('/audit-logs?pageSize=101').expect(400);
  });

  it('rejects an invalid actor filter', async () => {
    await request(app.getHttpServer())
      .get('/audit-logs?actorId=not-a-uuid')
      .expect(400);
  });

  it('forbids viewers', async () => {
    role = 'VIEWER';

    await request(app.getHttpServer()).get('/audit-logs').expect(403);
    expect(findMany).not.toHaveBeenCalled();
  });
});
