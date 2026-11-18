import {
  ValidationPipe,
  type ExecutionContext,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { DashboardController } from '../src/dashboard/dashboard.controller.js';
import { DashboardService } from '../src/dashboard/dashboard.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('GET /dashboard/overview (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const prisma = {
      account: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'acc-1',
            userId: 'user-1',
            accountNumber: 'MB-1001-0001',
            currency: 'USD',
            balance: { toString: () => '12500.00' },
          },
        ]),
      },
      transaction: { findMany: vi.fn().mockResolvedValue([]) },
      payee: { count: vi.fn().mockResolvedValue(2) },
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        DashboardService,
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

  afterAll(async () => {
    await app.close();
  });

  it('returns the overview for any authenticated role', async () => {
    const response = await request(app.getHttpServer())
      .get('/dashboard/overview')
      .expect(200);

    expect(response.body.totals).toEqual([
      { currency: 'USD', balance: '12500.00', accounts: 1 },
    ]);
    expect(response.body.series[0].points).toHaveLength(30);
    expect(response.body.payeeCount).toBe(2);
  });
});
