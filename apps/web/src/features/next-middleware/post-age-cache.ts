/**
 * Per-edge-isolate in-memory cache of post `created` dates.
 *
 * Used by middleware to refine entry-page Cache-Control TTL based on how
 * old a post is. Post creation dates on Hive are immutable, so once we know
 * a post's age, we can cache it indefinitely.
 *
 * Design notes:
 *   - Purely best-effort. A cache miss falls back to the conservative default
 *     entry tier in middleware — no added latency on the current request.
 *   - After a miss, middleware kicks off a background fetch via
 *     `event.waitUntil(refreshPostCreatedMs(...))`. The *next* request for
 *     the same post gets the refined TTL.
 *   - The cache is module-level, so it's per edge isolate. Different isolates
 *     may have independent caches; that's fine — this is a performance
 *     optimization, not a correctness requirement.
 *   - Bounded size: when full, evict the oldest entry (FIFO). Map iteration
 *     order is insertion order in modern JS.
 *   - Negative caching: failed lookups are cached briefly (5 min) to avoid
 *     hammering the upstream API with retries for posts that don't exist
 *     or return malformed responses.
 *   - Uses `callRPC` from @ecency/sdk directly to
 *     keep the edge middleware bundle minimal — importing the SDK would
 *     pull in React Query and other deps that don't apply here. hive-tx
 *     brings built-in node failover across 7 Hive RPC nodes with per-node
 *     health tracking and rate-limit awareness.
 */

import { callRPC } from "@ecency/sdk";

const MAX_ENTRIES = 2000;
const NEGATIVE_CACHE_TTL_MS = 5 * 60_000;
const FETCH_TIMEOUT_MS = 2000;
const FETCH_RETRIES = 2;

interface CacheEntry {
  createdMs: number | null; // null = negative cache (fetch failed or not found)
  cachedAt: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<void>>();

function key(author: string, permlink: string): string {
  return `${author}/${permlink}`;
}

/**
 * Synchronous cache lookup. Returns the post's created-timestamp in ms,
 * or null if we have a negative-cache entry, or undefined if we don't know.
 *
 * Callers must distinguish null (definitively unknown) from undefined
 * (not cached; should trigger a background refresh).
 */
export function getCachedPostCreatedMs(
  author: string,
  permlink: string
): number | null | undefined {
  const entry = cache.get(key(author, permlink));
  if (!entry) return undefined;

  // Negative entries expire after NEGATIVE_CACHE_TTL_MS; positive entries
  // are valid indefinitely (created dates are immutable on Hive).
  if (entry.createdMs === null && Date.now() - entry.cachedAt > NEGATIVE_CACHE_TTL_MS) {
    cache.delete(key(author, permlink));
    return undefined;
  }

  return entry.createdMs;
}

/**
 * Fire-and-forget fetch of the post's created date from the Hive RPC API.
 * Updates the in-memory cache. Swallows errors (logs a warning).
 *
 * Safe to call concurrently — in-flight requests are de-duplicated.
 * Intended for use with `event.waitUntil(...)` in middleware.
 */
export async function refreshPostCreatedMs(author: string, permlink: string): Promise<void> {
  const k = key(author, permlink);

  // De-duplicate concurrent fetches for the same post
  const existing = inflight.get(k);
  if (existing) return existing;

  const promise = (async () => {
    const createdMs = await fetchPostCreatedMs(author, permlink);
    setCacheEntry(k, createdMs);
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
    // Timeout, network error, all nodes failed, etc. — fall back to
    // negative cache; middleware uses the conservative default tier.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[post-age-cache] fetch failed", author, permlink, err);
    }
    return null;
  }
}

function setCacheEntry(k: string, createdMs: number | null): void {
  // FIFO eviction when at capacity
  if (cache.size >= MAX_ENTRIES && !cache.has(k)) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(k, { createdMs, cachedAt: Date.now() });
}

/** Test-only: reset internal state. */
export function __resetPostAgeCacheForTests(): void {
  cache.clear();
  inflight.clear();
}
