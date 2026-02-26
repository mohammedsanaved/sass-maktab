const edgeRateLimitState = new Map<string, { count: number; resetAt: number }>();

export interface EdgeRateLimitRule {
  limit: number;
  windowSeconds: number;
}

export function checkEdgeRateLimit(key: string, rule: EdgeRateLimitRule) {
  const now = Date.now();
  const existing = edgeRateLimitState.get(key);

  if (!existing || existing.resetAt <= now) {
    edgeRateLimitState.set(key, {
      count: 1,
      resetAt: now + rule.windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: rule.limit - 1,
      retryAfterSeconds: rule.windowSeconds,
    };
  }

  existing.count += 1;
  edgeRateLimitState.set(key, existing);

  if (existing.count > rule.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, rule.limit - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
