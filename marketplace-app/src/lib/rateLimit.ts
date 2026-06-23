import { Redis } from '@upstash/redis';

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();
let lastGlobalCleanupMs = 0;

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

// ── Distributed backend (Upstash Redis / Vercel KV) ──────────────────────────
// On serverless, in-memory counters are per-instance and reset on cold start,
// so they cannot reliably enforce limits. When Redis env vars are present we use
// a shared sliding-window log; otherwise we fall back to the in-memory limiter.
let redis: Redis | null = null;
let redisResolved = false;

function getRedis(): Redis | null {
  if (redisResolved) return redis;
  redisResolved = true;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
  }
  return redis;
}

function maybeCleanup(now: number) {
  const intervalMs = 5 * 60 * 1000;
  if (now - lastGlobalCleanupMs < intervalMs) return;
  lastGlobalCleanupMs = now;

  for (const [key, entry] of store.entries()) {
    const last = entry.timestamps[entry.timestamps.length - 1];
    if (!last || now - last > 3_600_000) {
      store.delete(key);
    }
  }
}

function rateLimitMemory(
  bucket: string,
  identifier: string,
  opts: RateLimitOptions
): RateLimitResult {
  const key = bucket + ':' + identifier;
  const now = Date.now();
  maybeCleanup(now);
  const windowStart = now - opts.windowMs;

  const entry = store.get(key) ?? { timestamps: [] };

  // Evict timestamps outside the current window
  entry.timestamps = entry.timestamps.filter(t => t > windowStart);

  if (entry.timestamps.length >= opts.limit) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + opts.windowMs - now;
    store.set(key, entry);
    return { ok: false, remaining: 0, retryAfterMs };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    ok: true,
    remaining: opts.limit - entry.timestamps.length,
    retryAfterMs: 0,
  };
}

async function rateLimitRedis(
  client: Redis,
  bucket: string,
  identifier: string,
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const key = `rl:${bucket}:${identifier}`;
  const now = Date.now();
  const windowStart = now - opts.windowMs;
  const member = `${now}-${Math.random().toString(36).slice(2)}`;

  // Atomic sliding-window log: drop old entries, record this hit, count, expire.
  const pipe = client.pipeline();
  pipe.zremrangebyscore(key, 0, windowStart);
  pipe.zadd(key, { score: now, member });
  pipe.zcard(key);
  pipe.pexpire(key, opts.windowMs);
  const results = (await pipe.exec()) as unknown[];
  const count = Number(results[2] ?? 0);

  if (count > opts.limit) {
    // This request is over the limit; remove the hit we just recorded so a
    // rejected request doesn't keep extending the window.
    await client.zrem(key, member);

    let retryAfterMs = opts.windowMs;
    const oldest = (await client.zrange(key, 0, 0, { withScores: true })) as (string | number)[];
    if (oldest && oldest.length >= 2) {
      retryAfterMs = Number(oldest[1]) + opts.windowMs - now;
    }
    return { ok: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  return { ok: true, remaining: Math.max(0, opts.limit - count), retryAfterMs: 0 };
}

export async function rateLimit(
  bucket: string,
  identifier: string,
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const client = getRedis();
  if (!client) return rateLimitMemory(bucket, identifier, opts);
  try {
    return await rateLimitRedis(client, bucket, identifier, opts);
  } catch (err) {
    // If Redis is unavailable, degrade to the in-memory limiter rather than
    // failing the request outright.
    console.error('rateLimit: Redis backend failed, falling back to memory:', err);
    return rateLimitMemory(bucket, identifier, opts);
  }
}

export function getIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
