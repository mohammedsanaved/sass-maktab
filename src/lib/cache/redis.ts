import Redis from 'ioredis';
import { logger } from '@/lib/observability/logger';

let redisClient: Redis | null = null;
let warned = false;

export function getRedisClient() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    if (!warned) {
      warned = true;
      logger.warn('REDIS_URL is not configured. Falling back to in-memory cache.');
    }
    return null;
  }

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redisClient.on('error', (error) => {
    logger.error('Redis client error', {
      message: error.message,
      name: error.name,
    });
  });

  return redisClient;
}
