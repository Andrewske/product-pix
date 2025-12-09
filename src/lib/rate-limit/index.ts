// src/lib/rate-limit/index.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Use Upstash Redis in production, in-memory in development
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// In-memory store for development
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter for development
 */
const inMemoryRatelimit = {
  async limit(identifier: string) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10;

    const record = inMemoryStore.get(identifier);

    if (!record || record.resetAt < now) {
      inMemoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
      return { success: true, remaining: maxRequests - 1 };
    }

    if (record.count >= maxRequests) {
      return { success: false, remaining: 0 };
    }

    record.count++;
    return { success: true, remaining: maxRequests - record.count };
  },
};

// Production rate limiter with Upstash
const upstashRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
      analytics: true,
    })
  : null;

/**
 * Rate limit a request by identifier (usually user ID)
 */
export const rateLimit = async (
  identifier: string
): Promise<{ success: boolean; remaining: number }> => {
  if (upstashRatelimit) {
    const result = await upstashRatelimit.limit(identifier);
    return { success: result.success, remaining: result.remaining };
  }

  return inMemoryRatelimit.limit(identifier);
};

/**
 * Different rate limits for different operations
 */
// Export Redis client for use in other modules
export { redis };
export const rateLimiters = {
  // Generation: 10 per minute per user
  generation: async (userId: string) => rateLimit(`generation:${userId}`),

  // Uploads: 20 per minute per user
  upload: async (userId: string) => rateLimit(`upload:${userId}`),

  // API general: 60 per minute per user
  api: async (userId: string) => rateLimit(`api:${userId}`),
};
