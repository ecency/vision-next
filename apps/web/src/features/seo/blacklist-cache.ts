/**
 * In-memory mirror of the abuse-blacklist set (community anti-abuse consensus,
 * e.g. spaminator), refreshed lazily from Redis. A daily server-side cron is
 * the only writer of `seo:blacklist:authors`; this module is read-only.
 *
 * Design (mirrors post-age-cache's L1 + background-refresh):
 *   - `getBlacklist()` is synchronous and always returns immediately so
 *     `isIndexable()` stays pure/sync. It returns the current in-memory set.
 *   - On a stale read it kicks off a non-awaited background refresh
 *     (single-flight) and serves the existing set meanwhile.
 *   - Cold-start fail-open: before the first successful load the set is
 *     empty → nothing is blacklist-noindexed (never mass-noindex on missing
 *     data; never block rendering).
 *   - Graceful degradation: Redis down / disabled / slow → keep the last
 *     good in-memory set indefinitely (a stale abuse list is safe).
 *   - Disabled under Vitest (SEO_REDIS_DISABLE/VITEST) → always empty;
 *     unit tests inject their own set into isIndexable directly.
 */
import { getSeoRedis, SEO_REDIS_PREFIX } from "./seo-redis";

const REDIS_KEY = `${SEO_REDIS_PREFIX}blacklist:authors`;
const REFRESH_TTL_MS = 12 * 60_000; // ~12 min
const EMPTY: ReadonlySet<string> = new Set<string>();

let current: ReadonlySet<string> = EMPTY;
let lastLoadedMs = 0;
let refreshing: Promise<void> | null = null;

async function refresh(): Promise<void> {
  const redis = getSeoRedis();
  if (!redis) return; // disabled / unavailable → keep current (fail-open)
  try {
    const members = await redis.smembers(REDIS_KEY);
    // Empty reply when the key is absent is normal pre-first-cron — keep
    // serving `current` rather than wiping a previously-good set.
    if (members && members.length > 0) {
      current = new Set(members);
      lastLoadedMs = Date.now();
    } else if (lastLoadedMs === 0) {
      // genuinely nothing yet — remain empty (fail-open), allow quick retry
    }
  } catch {
    // keep `current` (graceful degradation)
  }
}

function maybeRefresh(): void {
  if (refreshing) return;
  if (Date.now() - lastLoadedMs < REFRESH_TTL_MS && lastLoadedMs !== 0) return;
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
