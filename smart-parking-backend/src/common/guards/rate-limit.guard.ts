import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RedisService } from '../../redis/redis.service.js';
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../decorators/rate-limit.decorator.js';

const DEFAULT_RATE_LIMIT: RateLimitOptions = { limit: 300, windowSec: 60 };

// Guard global i thjeshtë anti-abuse mbi Redis (jo @nestjs/throttler — linja
// e tij stabile mbështet vetëm deri Nest 11, ky projekt është mbi Nest 12;
// shih CLAUDE.md §8 për arsyetimin e plotë). "Fixed window": INCR + EXPIRE
// mbi një çelës për IP+rrugë+dritare kohore — mjafton për anti-abuse bazë,
// pa pretenduar saktësinë e një "sliding window" algoritmi.
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const options =
      this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_RATE_LIMIT;

    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip ?? 'unknown';
    const routeKey = `${request.method}:${request.route?.path ?? request.path}`;
    const bucket = Math.floor(Date.now() / (options.windowSec * 1000));
    const key = `ratelimit:${routeKey}:${ip}:${bucket}`;

    const count = await this.redisService.publisher.incr(key);
    if (count === 1) {
      await this.redisService.publisher.expire(key, options.windowSec);
    }

    if (count > options.limit) {
      throw new HttpException(
        'Shumë kërkesa — provo përsëri pas pak',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
