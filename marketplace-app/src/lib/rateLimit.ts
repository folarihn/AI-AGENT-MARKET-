import { Redis } from '@upstash/redis';
import { prisma } from '@/lib/prisma';

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

// ── Backend selection ────────────────────────────────────────────────────────
// On serverless, in-memory counters are per-instance and reset on cold start,
// so they cannot reliably enforce limits. We prefer a shared store:
//   1. Upstash Redis / Vercel KV, if its env vars are present (fastest).
//   2. Otherwise the app's own Postgres DB (always available via DATABASE_URL).
//   3. In-memory only as a last resort if both are unavailable.
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

// ── In-memory backend (last resort) ──────────────────────────────────────────
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
  entry.timestamps = entry.timestamps.filter(t => t > windowStart);

  if (entry.timestamps.length >= opts.limit) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + opts.windowMs - now;
    store.set(key, entry);
    return { ok: false, remaining: 0, retryAfterMs };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return { ok: true, remaining: opts.limit - entry.timestamps.length, retryAfterMs: 0 };
}

// ── Redis backend ────────────────────────────────────────────────────────────
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

  const pipe = client.pipeline();
  pipe.zremrangebyscore(key, 0, windowStart);
  pipe.zadd(key, { score: now, member });
  pipe.zcard(key);
  pipe.pexpire(key, opts.windowMs);
  const results = (await pipe.exec()) as unknown[];
  const count = Number(results[2] ?? 0);

  if (count > opts.limit) {
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

// ── Postgres backend (default shared store) ──────────────────────────────────
// Self-provisioning: the table is created on first use so no migration step is
// required. If the DB user lacks DDL rights, ensurePgTable() returns false and
// we degrade to the in-memory limiter.
let pgReady: Promise<boolean> | null = null;

function ensurePgTable(): Promise<boolean> {
  if (!pgReady) {
    pgReady = (async () => {
      try {
        await prisma.$executeRawUnsafe(
          'CREATE TABLE IF NOT EXISTS "RateLimitHit" (bucket text NOT NULL, identifier text NOT NULL, ts bigint NOT NULL)'
        );
        await prisma.$executeRawUnsafe(
          'CREATE INDEX IF NOT EXISTS "RateLimitHit_key_ts_idx" ON "RateLimitHit" (bucket, identifier, ts)'
        );
        return true;
      } catch (err) {
        console.error('rateLimit: could not provision Postgres backend:', err);
        return false;
      }
    })();
  }
  return pgReady;
}

async function rateLimitPostgres(
  bucket: string,
  identifier: string,
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - opts.windowMs;

  // Drop this key's expired hits, record the current hit, then count.
  await prisma.$executeRaw`DELETE FROM "RateLimitHit" WHERE bucket = ${bucket} AND identifier = ${identifier} AND ts < ${windowStart}`;
  await prisma.$executeRaw`INSERT INTO "RateLimitHit" (bucket, identifier, ts) VALUES (${bucket}, ${identifier}, ${now})`;
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    SELECT count(*)::int AS count FROM "RateLimitHit" WHERE bucket = ${bucket} AND identifier = ${identifier}
  `;
  const count = Number(rows[0]?.count ?? 0);

  // Opportunistic global cleanup so abandoned keys don't accumulate forever.
  if (Math.random() < 0.02) {
    const cutoff = now - 24 * 60 * 60 * 1000;
    await prisma.$executeRaw`DELETE FROM "RateLimitHit" WHERE ts < ${cutoff}`;
  }

  if (count > opts.limit) {
    const oldestRows = await prisma.$queryRaw<{ min: bigint | number | null }[]>`
      SELECT min(ts) AS min FROM "RateLimitHit" WHERE bucket = ${bucket} AND identifier = ${identifier}
    `;
    const oldestTs = Number(oldestRows[0]?.min ?? now);
    return { ok: false, remaining: 0, retryAfterMs: Math.max(0, oldestTs + opts.windowMs - now) };
  }

  return { ok: true, remaining: Math.max(0, opts.limit - count), retryAfterMs: 0 };
}

export async function rateLimit(
  bucket: string,
  identifier: string,
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const client = getRedis();
  if (client) {
    try {
      return await rateLimitRedis(client, bucket, identifier, opts);
    } catch (err) {
      console.error('rateLimit: Redis backend failed, trying Postgres:', err);
    }
  }

  if (await ensurePgTable()) {
    try {
      return await rateLimitPostgres(bucket, identifier, opts);
    } catch (err) {
      console.error('rateLimit: Postgres backend failed, falling back to memory:', err);
    }
  }

  return rateLimitMemory(bucket, identifier, opts);
}

export function getIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
