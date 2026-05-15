// Simple in-memory sliding-window rate limiter.
//
// Caveat: state is per-Node-instance. On Vercel each cold start = new map,
// and a single user's requests can land on different lambdas. This is good
// enough to prevent runaway spend from one tab spamming the AI tutor, but
// not a security boundary. For a real limit, swap to Upstash/Redis.

const HITS = new Map<string, number[]>();

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (HITS.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
    HITS.set(key, hits);
    return { allowed: false, retryAfterSeconds };
  }

  hits.push(now);
  HITS.set(key, hits);

  // Best-effort GC so the map doesn't grow unbounded
  if (HITS.size > 5000) {
    for (const [k, arr] of HITS) {
      const trimmed = arr.filter((t) => t > cutoff);
      if (trimmed.length === 0) HITS.delete(k);
      else HITS.set(k, trimmed);
    }
  }

  return { allowed: true, remaining: limit - hits.length };
}
