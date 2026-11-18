import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AuthController } from '../src/auth/auth.controller.js';
import { AuthService } from '../src/auth/auth.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const admin = {
  id: 'user-admin',
  username: 'admin',
  email: 'admin@minibank.dev',
  name: 'Admin',
  passwordHash: bcrypt.hashSync('11111111', 10),
  role: 'OPERATOR' as const,
  createdAt: new Date(),
};

describe('POST /auth/login (e2e)', () => {
  let app: INestApplication;
  const findUnique = vi.fn();

  beforeAll(async () => {
    findUnique.mockImplementation(
      ({ where }: { where: { username?: string; email?: string } }) =>
        Promise.resolve(
          where.username === 'admin' || where.email === 'admin@minibank.dev'
            ? admin
            : null,
        ),
    );

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: { user: { findUnique } } },
        {
          provide: JwtService,
          useValue: { signAsync: vi.fn().mockResolvedValue('signed-token') },
        },
      ],
    }).compile();

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

  it('signs in with a username', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: 'admin', password: '11111111' })
      .expect(201);

    expect(response.body.accessToken).toBe('signed-token');
    expect(response.body.user).toMatchObject({
      username: 'admin',
      email: 'admin@minibank.dev',
      role: 'OPERATOR',
    });
  });

  it('signs in with an email in any case', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: 'ADMIN@MINIBANK.DEV', password: '11111111' })
      .expect(201);

    expect(findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@minibank.dev' },
    });
  });

  it('rejects a wrong password with one generic message', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: 'admin', password: '00000000' })
      .expect(401);

    expect(response.body.message).toBe('Invalid username or password');
  });

  it('rejects an unknown identifier with the same message', async () => {
    const wrong = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: 'admin', password: '00000000' })
      .expect(401);

    const unknown = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: 'ghost', password: '11111111' })
      .expect(401);

    expect(unknown.body.message).toBe(wrong.body.message);
  });

  it('rejects a short password with a validation error', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: 'admin', password: '123' })
      .expect(400);
  });

  it('rejects the removed email property', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identifier: 'admin',
        email: 'admin@minibank.dev',
        password: '11111111',
      })
      .expect(400);
  });
});
