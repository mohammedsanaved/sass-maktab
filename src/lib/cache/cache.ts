import { getRedisClient } from '@/lib/cache/redis';
import { incrementCounter } from '@/lib/observability/metrics';

interface MemoryEntry {
  value: string;
  expiresAt: number | null;
}

const memoryCache = new Map<string, MemoryEntry>();

function isExpired(entry: MemoryEntry) {
  return entry.expiresAt !== null && entry.expiresAt <= Date.now();
}

function pruneIfExpired(key: string, entry: MemoryEntry) {
  if (isExpired(entry)) {
    memoryCache.delete(key);
    return true;
  }
  return false;
}

export async function getCache(key: string): Promise<string | null> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const value = await redis.get(key);
      if (value === null) {
        incrementCounter('cache_misses_total', { backend: 'redis' });
      } else {
        incrementCounter('cache_hits_total', { backend: 'redis' });
      }
      return value;
    } catch {
      // fall through to memory cache
    }
  }

  const entry = memoryCache.get(key);
  if (!entry) {
    incrementCounter('cache_misses_total', { backend: 'memory' });
    return null;
  }

  if (pruneIfExpired(key, entry)) {
    incrementCounter('cache_misses_total', { backend: 'memory' });
    return null;
  }

  incrementCounter('cache_hits_total', { backend: 'memory' });
  return entry.value;
}

export async function setCache(key: string, value: string, ttlSeconds?: number) {
  const redis = getRedisClient();

  if (redis) {
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await redis.set(key, value, 'EX', ttlSeconds);
      } else {
        await redis.set(key, value);
      }
      return;
    } catch {
      // fall through to memory cache
    }
  }

  memoryCache.set(key, {
    value,
    expiresAt: ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
  });
}

export async function deleteCache(key: string) {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.del(key);
      return;
    } catch {
      // fall through to memory cache
    }
  }
  memoryCache.delete(key);
}

export async function incrementCounterWithTtl(key: string, ttlSeconds: number) {
  const redis = getRedisClient();

  if (redis) {
    try {
      const value = await redis.incr(key);
      if (value === 1) {
        await redis.expire(key, ttlSeconds);
      }
      const ttl = await redis.ttl(key);
      return {
        value,
        ttlSecondsRemaining: ttl > 0 ? ttl : ttlSeconds,
        backend: 'redis' as const,
      };
    } catch {
      // fall through to memory cache
    }
  }

  const now = Date.now();
  const existing = memoryCache.get(key);
  if (!existing || pruneIfExpired(key, existing)) {
    memoryCache.set(key, {
      value: '1',
      expiresAt: now + ttlSeconds * 1000,
    });
    return {
      value: 1,
      ttlSecondsRemaining: ttlSeconds,
      backend: 'memory' as const,
    };
  }

  const nextValue = Number(existing.value) + 1;
  memoryCache.set(key, { ...existing, value: String(nextValue) });
  return {
    value: nextValue,
    ttlSecondsRemaining: Math.max(0, Math.ceil(((existing.expiresAt || now) - now) / 1000)),
    backend: 'memory' as const,
  };
}
