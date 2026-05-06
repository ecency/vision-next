/**
 * Two-tier cache of post `created` dates used by middleware to refine
 * entry-page Cache-Control TTL based on post age.
 *
 *   L1 — module-level Map, per Node.js process (4 replicas per host)
 *   L2 — per-host Redis (shared across the 4 replicas), via docker overlay
 *
 * On Hive, post creation dates are immutable, so positive entries never
 * expire. Negative entries (RPC failure / not-found) are short-lived to
 * avoid hammering upstream for transient errors.
 *
 * Design:
 *   - Best-effort. A miss falls back to a conservative entry tier in
 *     middleware — no added latency on the current request.
 *   - After a miss, middleware kicks off `event.waitUntil(refreshPostCreatedMs)`.
 *     refresh checks Redis first (cheap dedup across replicas) and only hits
 *     RPC if Redis also missed. Both L1 and Redis are populated on success.
 *   - The synchronous getter only consults L1; we deliberately do NOT block
 *     on Redis from the request path.
 *   - Graceful degradation: Redis down / unreachable / slow → fall back to
 *     L1+RPC. Under no failure mode does middleware error leak to the user.
 *   - Bounded L1: FIFO eviction at MAX_ENTRIES.
 *   - Uses `callRPC` from @ecency/sdk for the upstream lookup. Tree-shakes
 *     to just the RPC call logic with built-in node failover and per-node
 *     health tracking.
 */

import { callRPC } from "@ecency/sdk";
import Redis, { type Redis as RedisClient } from "ioredis";

const MAX_ENTRIES = 2000;
const NEGATIVE_CACHE_TTL_MS = 5 * 60_000;
const NEGATIVE_CACHE_TTL_S = 300;
const FETCH_TIMEOUT_MS = 2000;
const FETCH_RETRIES = 2;

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const REDIS_KEY_PREFIX = "postage:";
// Skip Redis under Vitest so unit tests don't open real TCP connections.
const REDIS_DISABLED = !!process.env.VITEST || process.env.POSTAGE_CACHE_DISABLE_REDIS === "1";

interface CacheEntry {
  createdMs: number | null; // null = negative cache (fetch failed or not found)
  cachedAt: number;
}

const l1 = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<void>>();

function key(author: string, permlink: string): string {
  return `${author}/${permlink}`;
}

let _redis: RedisClient | null | undefined;
function getRedis(): RedisClient | null {
  if (_redis !== undefined) return _redis;
  if (REDIS_DISABLED) {
    _redis = null;
    return null;
  }
  try {
    _redis = new Redis(REDIS_URL, {
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 1000,
      commandTimeout: 200,
      retryStrategy: () => null
    });
    // Silent — graceful degradation to L1+RPC on any Redis error.
    _redis.on("error", () => {});
    return _redis;
  } catch {
    _redis = null;
    return null;
  }
}

/**
 * Synchronous cache lookup. Returns the post's created-timestamp in ms,
 * or null if we have a negative-cache entry, or undefined if we don't know.
 *
 * Only L1 is consulted — Redis is async and middleware can't await on the
 * request path. A miss returns undefined and the caller should kick off
 * `refreshPostCreatedMs` via `event.waitUntil(...)`.
 */
export function getCachedPostCreatedMs(
  author: string,
  permlink: string
): number | null | undefined {
  const k = key(author, permlink);
  const entry = l1.get(k);
  if (!entry) return undefined;

  // Negative entries expire after NEGATIVE_CACHE_TTL_MS; positive entries
  // are valid indefinitely (created dates are immutable on Hive).
  if (entry.createdMs === null && Date.now() - entry.cachedAt > NEGATIVE_CACHE_TTL_MS) {
    l1.delete(k);
    return undefined;
  }

  return entry.createdMs;
}

/**
 * Background refresh: populate L1 (and Redis when available) from
 * Redis-then-RPC. De-duplicates concurrent calls per (author, permlink).
 * Intended for `event.waitUntil(...)` in middleware.
 */
export async function refreshPostCreatedMs(author: string, permlink: string): Promise<void> {
  const k = key(author, permlink);

  const existing = inflight.get(k);
  if (existing) return existing;

  const promise = (async () => {
    const redis = getRedis();

    // L2: try Redis first — another replica may already have populated it.
    if (redis) {
      try {
        const v = await redis.get(REDIS_KEY_PREFIX + k);
        if (v !== null) {
          const createdMs = v === "null" ? null : Number(v);
          // Number("non-numeric") → NaN → treat as negative.
          setL1(k, Number.isFinite(createdMs as number) ? (createdMs as number) : null);
          return;
        }
      } catch {
        // Fall through to RPC.
      }
    }

    // L2 miss → RPC.
    const createdMs = await fetchPostCreatedMs(author, permlink);
    setL1(k, createdMs);

    // Write back to Redis. Don't fail the refresh if Redis is unreachable —
    // L1 already has the answer for this replica.
    if (redis) {
      try {
        if (createdMs === null) {
          await redis.set(REDIS_KEY_PREFIX + k, "null", "EX", NEGATIVE_CACHE_TTL_S);
        } else {
          await redis.set(REDIS_KEY_PREFIX + k, String(createdMs));
        }
      } catch {
        // Silent — see above.
      }
    }
  })().finally(() => {
    inflight.delete(k);
  });

  inflight.set(k, promise);
  return promise;
}

async function fetchPostCreatedMs(
  author: string,
  permlink: string
): Promise<number | null> {
  try {
    const result = (await callRPC(
      "condenser_api.get_content",
      [author, permlink],
      FETCH_TIMEOUT_MS,
      FETCH_RETRIES
    )) as { created?: string } | null | undefined;

    const createdStr = result?.created;
    if (!createdStr) return null;

    // Hive returns "YYYY-MM-DDTHH:MM:SS" without timezone (UTC assumed)
    const ms = Date.parse(createdStr + "Z");
    return Number.isFinite(ms) ? ms : null;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[post-age-cache] fetch failed", author, permlink, err);
    }
    return null;
  }
}

function setL1(k: string, createdMs: number | null): void {
  // FIFO eviction when at capacity
  if (l1.size >= MAX_ENTRIES && !l1.has(k)) {
    const oldest = l1.keys().next().value;
    if (oldest !== undefined) l1.delete(oldest);
  }
  l1.set(k, { createdMs, cachedAt: Date.now() });
}

/** Test-only: reset internal state. */
export function __resetPostAgeCacheForTests(): void {
  l1.clear();
  inflight.clear();
  if (_redis) {
    try {
      _redis.disconnect();
    } catch {
      // ignore
    }
  }
  _redis = undefined;
}
