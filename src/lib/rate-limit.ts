/**
 * Simple in-memory sliding-window rate limiter keyed by user id.
 *
 * Good enough for a single Next.js instance. For multi-instance / serverless
 * scale-out, swap the store for Redis or similar.
 */

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms when the oldest request in the window expires */
  resetAt: number;
};

type Bucket = {
  hits: number[];
};

const buckets = new Map<string, Bucket>();

/** Align with python-service/guardrails.py */
export const RATE_LIMITS = {
  chat: { limit: 20, windowMs: 60_000 },
  ingest: { limit: 10, windowMs: 60_000 },
  search: { limit: 30, windowMs: 60_000 },
  title: { limit: 10, windowMs: 60_000 },
} as const;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

function prune(hits: number[], windowStart: number): number[] {
  return hits.filter((t) => t > windowStart);
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
  const windowStart = now - windowMs;
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = prune(bucket.hits, windowStart);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] ?? now;
    buckets.set(key, bucket);
    return {
      ok: false,
      limit,
      remaining: 0,
      resetAt: oldest + windowMs,
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  const oldest = bucket.hits[0] ?? now;
  return {
    ok: true,
    limit,
    remaining: Math.max(0, limit - bucket.hits.length),
    resetAt: oldest + windowMs,
  };
}

export function checkUserRateLimit(
  userId: string,
  bucket: RateLimitBucket,
): RateLimitResult {
  const { limit, windowMs } = RATE_LIMITS[bucket];
  return checkRateLimit(`${bucket}:${userId}`, limit, windowMs);
}

export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfterSec = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000),
  );

  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again shortly.',
      limit: result.limit,
      remaining: result.remaining,
      retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}

/** Test helper — clears all buckets. */
export function resetRateLimitStore(): void {
  buckets.clear();
}
