/**
 * In-memory mirror of the abuse-blacklist set (community anti-abuse consensus),
 * refreshed lazily from Redis. A **daily** server-side cron is the only writer
 * of the Redis key; this module is read-only.
 *
 * Design (mirrors post-age-cache's L1 + background-refresh):
 *   - `getBlacklist()` is synchronous and returns immediately so
 *     `isIndexable()` stays pure/sync — it returns the current in-memory set.
 *   - Refresh is gated by **last-attempt time, set before the async work
 *     starts**. This bounds the Redis cadence regardless of whether the
 *     refresh succeeds, fails, is slow, returns empty (pre-first-cron), or
 *     Redis is down — fixing the tight SMEMBERS poll that occurred when the
 *     key didn't exist yet (lastLoaded never advanced).
 *   - Two cadences: once loaded, re-read every MEMORY_REFRESH_MS (the source
 *     changes only daily — frequent re-reads are pure waste); before the
 *     first successful load, retry every COLD_RETRY_MS so a freshly-booted
 *     replica picks up the set soon after the cron first writes it.
 *   - Cold-start fail-open: empty set until the first non-empty load → nothing
 *     is blacklist-noindexed on missing data; never blocks rendering.
 *   - Graceful degradation: Redis down / disabled / slow / key absent → keep
 *     the last good in-memory set (a stale abuse list is safe).
 *   - Disabled under Vitest (seo-redis returns null) → always empty; unit
 *     tests inject their own set into isIndexable directly.
 */
import { getSeoRedis, SEO_REDIS_PREFIX } from "./seo-redis";

const REDIS_KEY = `${SEO_REDIS_PREFIX}blacklist:authors`;
// Source is rewritten once a day by the cron; re-reading it into process
// memory every 6h propagates a new list within hours of the daily write
// without the churn of a tight TTL (was 12m — far too frequent for daily data).
const MEMORY_REFRESH_MS = 6 * 60 * 60_000;
const COLD_RETRY_MS = 60_000; // only until the first successful populate

let current: ReadonlySet<string> = new Set<string>();
let loaded = false; // have we ever loaded a non-empty set?
let lastAttemptMs = 0;
let refreshing: Promise<void> | null = null;

async function refresh(): Promise<void> {
  const redis = getSeoRedis();
  if (!redis) return; // disabled / unavailable → keep current (fail-open)
  try {
    const members = await redis.smembers(REDIS_KEY);
    // Empty reply pre-first-cron is normal — keep serving `current` (empty)
    // rather than wiping a previously-good set; `loaded` stays false so the
    // faster cold-retry cadence continues until the cron writes the key.
    if (members && members.length > 0) {
      current = new Set(members);
      loaded = true;
    }
  } catch {
    // keep `current` (graceful degradation)
  }
}

function maybeRefresh(): void {
  if (refreshing) return;
  const interval = loaded ? MEMORY_REFRESH_MS : COLD_RETRY_MS;
  if (Date.now() - lastAttemptMs < interval) return;
  lastAttemptMs = Date.now(); // set BEFORE the async work → bounded cadence
  refreshing = refresh().finally(() => {
    refreshing = null;
  });
  // intentionally not awaited
}

/** Current abuse-blacklist set. Sync, immediate, never throws. */
export function getBlacklist(): ReadonlySet<string> {
  maybeRefresh();
  return current;
}
