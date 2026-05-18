/**
 * Single source of truth for "is this author abuse-blacklisted?" on the SSR
 * metadata path. Reads the shared per-origin Redis set directly — NOT a
 * per-process in-memory copy.
 *
 * Why no in-process cache: each origin runs multiple `web` replicas. A memory
 * map would let replicas disagree (one refreshed, one stale) for the whole
 * refresh window, so the same author could be indexed by one replica and
 * noindexed by another. Redis is the one set every replica shares, kept fresh
 * by the daily blacklist-refresh cron — reading it per request keeps every
 * replica consistent.
 *
 * Cost: one O(1) SISMEMBER against the local overlay Redis (sub-ms), on a
 * path that already awaits RPC. Fail-open: any miss/error/no-client → not
 * blacklisted (never block or wrongly noindex a render on a cache hiccup;
 * the crawl-time SSR check is a hint, and the sitemap applies the same set).
 */
import { getSeoRedis, SEO_REDIS_PREFIX } from "@/features/seo/seo-redis";

const KEY = `${SEO_REDIS_PREFIX}blacklist:authors`;

export async function isAuthorBlacklisted(author: string): Promise<boolean> {
  if (!author) return false;
  const redis = getSeoRedis();
  if (!redis) return false;
  try {
    return (await redis.sismember(KEY, author)) === 1;
  } catch {
    return false;
  }
}
