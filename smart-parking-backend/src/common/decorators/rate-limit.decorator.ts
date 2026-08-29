import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  limit: number;
  windowSec: number;
}

export const RATE_LIMIT_KEY = 'rateLimit';

/** Mbishkruan limitin global (shih RateLimitGuard) për një rrugë specifike — p.sh. login/register kundër brute-force. */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
