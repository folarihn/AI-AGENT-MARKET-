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

export function rateLimit(
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

export function getIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
