import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { JwtPayload } from './types/jwt-payload.js';

type SafeUser = Pick<User, 'id' | 'username' | 'name' | 'email' | 'role'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string; user: SafeUser }> {
    const user = await this.validateCredentials(dto.identifier, dto.password);
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user,
    };
  }

  async validateCredentials(
    identifier: string,
    password: string,
  ): Promise<SafeUser> {
    const normalized = identifier.trim().toLowerCase();

    // Both columns are unique, so an identifier is unambiguous: an '@' means email.
    const user = normalized.includes('@')
      ? await this.prisma.user.findUnique({ where: { email: normalized } })
      : await this.prisma.user.findUnique({ where: { username: normalized } });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
