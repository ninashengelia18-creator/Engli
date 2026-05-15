// Per-key sliding-window rate limiter.
//
// Two backends:
//   1. Upstash Redis REST (preferred for production / multi-instance deploys).
//      Activated automatically when both UPSTASH_REDIS_REST_URL and
//      UPSTASH_REDIS_REST_TOKEN are set. Uses ZSET sliding-window semantics
//      executed in a single MULTI pipeline.
//   2. In-memory fallback. Per-Node-process. Fine for single-instance / local
//      dev. Caveat: a single user's requests can land on different lambdas, so
//      on Vercel this is a "best effort, prevent runaway tab spam" limit only.
//
// The Upstash call has a hard timeout and falls back to in-memory on any
// transport error so a brief Upstash outage cannot take down the AI tutor.

const HITS = new Map<string, number[]>();

export type RateLimitResult =
  | { allowed: true; remaining: number; backend: 'upstash' | 'memory' }
  | { allowed: false; retryAfterSeconds: number; backend: 'upstash' | 'memory' };

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const UPSTASH_TIMEOUT_MS = 800;

function memoryCheck(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (HITS.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
    HITS.set(key, hits);
    return { allowed: false, retryAfterSeconds, backend: 'memory' };
  }

  hits.push(now);
  HITS.set(key, hits);

  if (HITS.size > 5000) {
    for (const [k, arr] of HITS) {
      const trimmed = arr.filter((t) => t > cutoff);
      if (trimmed.length === 0) HITS.delete(k);
      else HITS.set(k, trimmed);
    }
  }

  return { allowed: true, remaining: limit - hits.length, backend: 'memory' };
}

async function upstashCheck(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;

  const now = Date.now();
  const cutoff = now - windowMs;
  const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;
  const ttlSeconds = Math.ceil(windowMs / 1000) + 1;
  const redisKey = `rl:${key}`;

  // Pipeline: drop expired members, add this hit, count, set TTL, fetch oldest.
  const body = JSON.stringify([
    ['ZREMRANGEBYSCORE', redisKey, '0', String(cutoff)],
    ['ZADD', redisKey, String(now), member],
    ['ZCARD', redisKey],
    ['EXPIRE', redisKey, String(ttlSeconds)],
    ['ZRANGE', redisKey, '0', '0', 'WITHSCORES']
  ]);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTASH_TIMEOUT_MS);
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body,
      signal: controller.signal,
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    if (!Array.isArray(data) || data.some((r) => r.error)) return null;

    const count = Number(data[2]?.result ?? 0);
    if (count <= limit) {
      return { allowed: true, remaining: Math.max(0, limit - count), backend: 'upstash' };
    }

    // Over the limit. Use the oldest entry's score to compute retry-after,
    // and roll back this hit so the window can refill cleanly.
    const oldest = Array.isArray(data[4]?.result) ? (data[4]!.result as string[]) : [];
    const oldestScore = oldest.length >= 2 ? Number(oldest[1]) : now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestScore + windowMs - now) / 1000));

    // Best-effort cleanup of the hit we just added (don't block on it).
    fetch(`${UPSTASH_URL}/zrem/${encodeURIComponent(redisKey)}/${encodeURIComponent(member)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store'
    }).catch(() => {});

    return { allowed: false, retryAfterSeconds, backend: 'upstash' };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const upstash = await upstashCheck(key, limit, windowMs);
  if (upstash) return upstash;
  return memoryCheck(key, limit, windowMs);
}

export function isUpstashConfigured(): boolean {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN);
}
