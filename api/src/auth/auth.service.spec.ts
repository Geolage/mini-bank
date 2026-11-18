import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const passwordHash = bcrypt.hashSync('11111111', 10);
  const user = {
    id: 'user-1',
    username: 'admin',
    email: 'admin@minibank.dev',
    name: 'Admin',
    passwordHash,
    role: 'OPERATOR' as const,
    createdAt: new Date(),
  };

  let findUnique: ReturnType<typeof vi.fn>;
  let signAsync: ReturnType<typeof vi.fn>;
  let service: AuthService;

  beforeEach(() => {
    findUnique = vi.fn();
    signAsync = vi.fn();
    const prisma = { user: { findUnique } } as unknown as PrismaService;
    const jwtService = { signAsync } as unknown as JwtService;
    service = new AuthService(prisma, jwtService);
  });

  it('signs in with a username', async () => {
    findUnique.mockResolvedValue(user);
    signAsync.mockResolvedValue('signed-token');

    const result = await service.login({
      identifier: 'admin',
      password: '11111111',
    });

    expect(findUnique).toHaveBeenCalledWith({ where: { username: 'admin' } });
    expect(result.accessToken).toBe('signed-token');
    expect(result.user).toEqual({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: 'OPERATOR',
    });
    expect(signAsync).toHaveBeenCalledWith({
      sub: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: 'OPERATOR',
    });
  });

  it('signs in with an email', async () => {
    findUnique.mockResolvedValue(user);
    signAsync.mockResolvedValue('signed-token');

    await service.login({
      identifier: 'admin@minibank.dev',
      password: '11111111',
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@minibank.dev' },
    });
  });

  it('lowercases and trims the identifier', async () => {
    findUnique.mockResolvedValue(user);
    signAsync.mockResolvedValue('signed-token');

    await service.login({ identifier: '  ADMIN  ', password: '11111111' });

    expect(findUnique).toHaveBeenCalledWith({ where: { username: 'admin' } });
  });

  it('returns the same error for an unknown username and a wrong password', async () => {
    findUnique.mockResolvedValue(null);
    const unknown = await service
      .login({ identifier: 'ghost', password: '11111111' })
      .catch((error: unknown) => error as UnauthorizedException);

    findUnique.mockResolvedValue(user);
    const wrongPassword = await service
      .login({ identifier: 'admin', password: '00000000' })
      .catch((error: unknown) => error as UnauthorizedException);

    expect(unknown).toBeInstanceOf(UnauthorizedException);
    expect(wrongPassword).toBeInstanceOf(UnauthorizedException);
    expect((unknown as UnauthorizedException).message).toBe(
      (wrongPassword as UnauthorizedException).message,
    );
    expect((unknown as UnauthorizedException).message).toBe(
      'Invalid username or password',
    );
    expect(signAsync).not.toHaveBeenCalled();
  });
});
