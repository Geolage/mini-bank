import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const passwordHash = bcrypt.hashSync('Password123!', 10);
  const user = {
    id: 'user-1',
    email: 'operator@minibank.dev',
    name: 'Alex Chen',
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

  it('returns a token for valid credentials', async () => {
    findUnique.mockResolvedValue(user);
    signAsync.mockResolvedValue('signed-token');

    const result = await service.login({
      email: user.email,
      password: 'Password123!',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(result.user).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'OPERATOR',
    });
    expect(signAsync).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: 'OPERATOR',
    });
  });

  it('rejects an unknown email', async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nobody@minibank.dev', password: 'Password123!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a wrong password', async () => {
    findUnique.mockResolvedValue(user);

    await expect(
      service.login({ email: user.email, password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(signAsync).not.toHaveBeenCalled();
  });
});
