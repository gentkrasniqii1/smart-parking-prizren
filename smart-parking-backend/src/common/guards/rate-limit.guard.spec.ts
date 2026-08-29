import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard.js';

function createContext(
  overrides: Partial<{ type: string; ip: string; method: string; path: string }> = {},
): ExecutionContext {
  const request = {
    ip: overrides.ip ?? '127.0.0.1',
    method: overrides.method ?? 'POST',
    path: overrides.path ?? '/auth/login',
    route: { path: overrides.path ?? '/auth/login' },
  };

  return {
    getType: () => overrides.type ?? 'http',
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

async function expectHttpStatus(promise: Promise<unknown>, status: number): Promise<void> {
  try {
    await promise;
    expect.unreachable('expected canActivate to throw');
  } catch (error) {
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(status);
  }
}

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let redisService: {
    publisher: { incr: ReturnType<typeof vi.fn>; expire: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn().mockReturnValue(undefined) };
    redisService = {
      publisher: {
        incr: vi.fn().mockResolvedValue(1),
        expire: vi.fn().mockResolvedValue(1),
      },
    };
    guard = new RateLimitGuard(reflector as unknown as Reflector, redisService as never);
  });

  it('bypasses non-HTTP contexts (e.g. WebSocket)', async () => {
    const context = createContext({ type: 'ws' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(redisService.publisher.incr).not.toHaveBeenCalled();
  });

  it('sets an expiry on the key only on the first hit in a window', async () => {
    redisService.publisher.incr.mockResolvedValueOnce(1);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
    expect(redisService.publisher.expire).toHaveBeenCalledWith(expect.any(String), 60);
  });

  it('allows requests under the configured limit without resetting the expiry', async () => {
    reflector.getAllAndOverride.mockReturnValue({ limit: 5, windowSec: 60 });
    redisService.publisher.incr.mockResolvedValueOnce(4);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
    expect(redisService.publisher.expire).not.toHaveBeenCalled();
  });

  it('throws 429 once the count exceeds the configured limit', async () => {
    reflector.getAllAndOverride.mockReturnValue({ limit: 5, windowSec: 60 });
    redisService.publisher.incr.mockResolvedValueOnce(6);

    await expectHttpStatus(guard.canActivate(createContext()), 429);
  });

  it('falls back to the default 300/60s limit when no @RateLimit metadata is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    redisService.publisher.incr.mockResolvedValueOnce(301);

    await expectHttpStatus(guard.canActivate(createContext()), 429);
  });
});
