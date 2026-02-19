/**
 * In-memory rate limiter for Next.js API routes.
 * Uses a sliding window algorithm.
 *
 * For production at scale, replace with Upstash Redis:
 * https://github.com/upstash/ratelimit
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// Store: identifier → { count, resetAt }
const store = new Map<string, RateLimitRecord>();

// Cleanup interval: remove expired records every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (record.resetAt < now) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /** Max requests per window */
  max: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  /** Remaining requests in this window */
  remaining: number;
  /** Epoch ms when window resets */
  resetAt: number;
  /** Requests made in this window */
  count: number;
}

/**
 * Check rate limit for a given identifier (IP, user ID, etc.)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(identifier);

  if (!existing || existing.resetAt < now) {
    // New window
    const record: RateLimitRecord = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    store.set(identifier, record);
    return {
      success: true,
      remaining: config.max - 1,
      resetAt: record.resetAt,
      count: 1,
    };
  }

  // Existing window
  existing.count += 1;

  if (existing.count > config.max) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.resetAt,
      count: existing.count,
    };
  }

  return {
    success: true,
    remaining: config.max - existing.count,
    resetAt: existing.resetAt,
    count: existing.count,
  };
}

/**
 * Get client IP from Next.js request, accounting for proxies.
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

// Pre-configured limiters
export const RATE_LIMITS = {
  /** Full-text search: 60/min for free, 200/min for pro */
  search: { max: 60, windowMs: 60 * 1000 },
  /** AI answers: 10/min (expensive LLM calls) */
  ask: { max: 10, windowMs: 60 * 1000 },
  /** General API: 100/min */
  api: { max: 100, windowMs: 60 * 1000 },
} as const;
