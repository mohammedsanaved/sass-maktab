import { ApiError } from '@/lib/server/api-utils';
import { incrementCounterWithTtl } from '@/lib/cache/cache';
import { incrementCounter } from '@/lib/observability/metrics';

export interface RateLimitRule {
  keyPrefix: string;
  limit: number;
  windowSeconds: number;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
}

export async function assertRateLimit(request: Request, rule: RateLimitRule) {
  const userId = request.headers.get('x-user-id');
  const subject = userId ? `user:${userId}` : `ip:${getClientIp(request)}`;
  const key = `ratelimit:${rule.keyPrefix}:${subject}`;

  const result = await incrementCounterWithTtl(key, rule.windowSeconds);
  const remaining = Math.max(0, rule.limit - result.value);

  if (result.value > rule.limit) {
    incrementCounter('http_rate_limited_total', {
      keyPrefix: rule.keyPrefix,
      backend: result.backend,
    });
    throw new ApiError(429, 'Too many requests', 'RATE_LIMITED', {
      limit: rule.limit,
      windowSeconds: rule.windowSeconds,
      retryAfterSeconds: result.ttlSecondsRemaining,
      remaining,
    });
  }

  return {
    limit: rule.limit,
    remaining,
    resetAfterSeconds: result.ttlSecondsRemaining,
  };
}
