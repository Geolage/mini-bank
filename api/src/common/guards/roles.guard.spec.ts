import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RolesGuard } from './roles.guard.js';

function createContext(role?: Role): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let getAllAndOverride: ReturnType<typeof vi.fn>;
  let guard: RolesGuard;

  beforeEach(() => {
    getAllAndOverride = vi.fn();
    const reflector = { getAllAndOverride } as unknown as Reflector;
    guard = new RolesGuard(reflector);
  });

  it('allows routes without role metadata', () => {
    getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows an operator on an operator-only route', () => {
    getAllAndOverride.mockReturnValue(['OPERATOR']);

    expect(guard.canActivate(createContext('OPERATOR'))).toBe(true);
  });

  it('rejects a viewer on an operator-only route', () => {
    getAllAndOverride.mockReturnValue(['OPERATOR']);

    expect(() => guard.canActivate(createContext('VIEWER'))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects anonymous requests on a protected route', () => {
    getAllAndOverride.mockReturnValue(['OPERATOR']);

    expect(() => guard.canActivate(createContext())).toThrow(
      ForbiddenException,
    );
  });
});
