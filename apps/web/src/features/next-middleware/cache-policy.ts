/**
 * Cache policy resolution for HTML responses.
 *
 * Returns the Cache-Control tier that should be applied to a given pathname,
 * or null if no policy applies (middleware will leave the response untouched).
 *
 * Entry (post) pages use a conservative default tier derived from URL alone.
 * When the post's created date is known (via post-age-cache), the tier is
 * refined by age — see `getEntryTierForAge` and `post-age-cache.ts`.
 *
 * All TTLs are expressed for shared caches (Nginx, Cloudflare):
 *   - max-age=0          → browsers always revalidate HTML
 *   - s-maxage=N         → CDN serves fresh for N seconds
 *   - stale-while-revalidate=M → CDN serves stale for M more seconds
 *                                while revalidating in background
 */

export interface CachePolicy {
  tier: string;
  sMaxAge: number;
  staleWhileRevalidate: number;
}

const NO_CACHE_TIER = "no-cache";

/** Routes that must never be edge-cached (user-specific or interactive). */
const NO_CACHE_PREFIXES = [
  "/publish",
  "/chats",
  "/auth",
  "/signup",
  "/submit",
  "/draft",
  "/onboard-friend",
  "/purchase",
  "/perks",
  "/decks",
  "/waves",
  "/market",
  "/search",
  "/wallet"
];

/** Profile subsections that must never be edge-cached. */
const NO_CACHE_PROFILE_SECTIONS = new Set(["wallet", "settings", "permissions", "referrals"]);

/**
 * Profile subsections that aggregate content from OTHER users (not the
 * profile owner's authored content). Update faster than profile-owned
 * sections and get the feed tier instead of the profile tier.
 *
 * - `feed`  rewrites to the personalized feed route (/feed/feed/:author),
 *           which falls back to the ecency observer for anonymous viewers.
 *           Content is deterministic per URL for anon, but it's a feed of
 *           posts from followed users and should refresh on feed cadence.
 * - `trail` shows the user's curation trail (votes on others' posts),
 *           which also updates faster than authored content.
 */
const PROFILE_FEED_SECTIONS = new Set(["feed", "trail"]);

/** Static content pages — effectively permanent. */
const STATIC_PAGES = new Set([
  "/faq",
  "/about",
  "/child-safety",
  "/contributors",
  "/privacy-policy",
  "/terms-of-service",
  "/whitepaper",
  "/mobile"
]);

const FEED_FILTERS = new Set(["hot", "created", "trending", "payout", "muted", "promoted"]);

export function getCachePolicyForPath(pathname: string): CachePolicy | null {
  // Strip trailing slash (except root) for consistent matching.
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  // Never cache API routes, Next internals, or assets (those are handled in next.config.js).
  if (
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    path.startsWith("/assets/") ||
    path.startsWith("/scripts/")
  ) {
    return null;
  }

  // No-cache paths (user-specific / interactive).
  for (const prefix of NO_CACHE_PREFIXES) {
    if (path === prefix || path.startsWith(prefix + "/")) {
      return { tier: NO_CACHE_TIER, sMaxAge: 0, staleWhileRevalidate: 0 };
    }
  }

  // Static content pages.
  if (STATIC_PAGES.has(path)) {
    return { tier: "static", sMaxAge: 86400, staleWhileRevalidate: 604800 };
  }

  // Homepage.
  if (path === "/") {
    return { tier: "home", sMaxAge: 300, staleWhileRevalidate: 3600 };
  }

  // List pages.
  if (path === "/discover" || path.startsWith("/discover/")) {
    return { tier: "list", sMaxAge: 300, staleWhileRevalidate: 3600 };
  }
  if (path === "/communities") {
    return { tier: "list", sMaxAge: 300, staleWhileRevalidate: 3600 };
  }
  if (path === "/witnesses") {
    return { tier: "list", sMaxAge: 300, staleWhileRevalidate: 3600 };
  }
  if (path === "/proposals" || path.startsWith("/proposals/")) {
    return { tier: "list-proposals", sMaxAge: 600, staleWhileRevalidate: 3600 };
  }
  if (path === "/tags") {
    return { tier: "list", sMaxAge: 300, staleWhileRevalidate: 3600 };
  }
  // /tags/:tag rewrites to /feed/created/:tag — treat as created-feed
  if (path.startsWith("/tags/")) {
    return { tier: "feed-created", sMaxAge: 30, staleWhileRevalidate: 120 };
  }

  // Profile pages: /@author or /@author/:section or /@author/:section/...
  // Must match before entry-page check (also starts with /@author).
  const profileMatch = path.match(/^\/@[^/]+(?:\/([^/]+))?(?:\/|$)/);
  if (profileMatch) {
    const segments = path.split("/").filter(Boolean);
    // Entry: /@author/permlink (exactly 2 segments, second is not a known section)
    if (segments.length === 2) {
      const second = segments[1];
      if (
        !NO_CACHE_PROFILE_SECTIONS.has(second) &&
        !["posts", "blog", "comments", "replies", "communities", "trail", "insights", "rss", "rss.xml", "feed"].includes(
          second
        )
      ) {
        // /@author/permlink — entry page
        return { tier: "entry", sMaxAge: 3600, staleWhileRevalidate: 86400 };
      }
    }
    const section = profileMatch[1];
    if (section && NO_CACHE_PROFILE_SECTIONS.has(section)) {
      return { tier: NO_CACHE_TIER, sMaxAge: 0, staleWhileRevalidate: 0 };
    }
    if (section && PROFILE_FEED_SECTIONS.has(section)) {
      return { tier: "profile-feed", sMaxAge: 60, staleWhileRevalidate: 300 };
    }
    return { tier: "profile", sMaxAge: 300, staleWhileRevalidate: 3600 };
  }

  // Feed pages: /:filter, /:filter/:tag, /:filter/:tag/:sub
  const firstSegment = path.split("/").filter(Boolean)[0];
  if (firstSegment && FEED_FILTERS.has(firstSegment)) {
    if (firstSegment === "created") {
      return { tier: "feed-created", sMaxAge: 30, staleWhileRevalidate: 120 };
    }
    return { tier: "feed", sMaxAge: 60, staleWhileRevalidate: 300 };
  }

  // Community pages: /:tag/hive-xxxxx or /:tag/hive-xxxxx/:sub
  if (/^\/[^/@][^/]*\/hive-\d{5,6}(\/|$)/.test(path)) {
    return { tier: "community", sMaxAge: 60, staleWhileRevalidate: 300 };
  }

  // Entry pages: /:category/@author/:permlink
  // Single conservative tier. CF worker refines per post age.
  if (/^\/[^/]+\/@[^/]+\/[^/]+/.test(path)) {
    return { tier: "entry", sMaxAge: 3600, staleWhileRevalidate: 86400 };
  }

  // Unknown — skip.
  return null;
}

/** Build a Cache-Control header value from a policy. */
export function buildCacheControlHeader(policy: CachePolicy, isLoggedIn: boolean): string {
  if (isLoggedIn || policy.tier === NO_CACHE_TIER) {
    return "private, no-store";
  }
  return `public, max-age=0, s-maxage=${policy.sMaxAge}, stale-while-revalidate=${policy.staleWhileRevalidate}`;
}

const DAY_MS = 86400_000;

/**
 * Refine the entry-page tier based on post age.
 *
 * Older posts change much less and tolerate far longer caching. On Hive,
 * posts are frozen (payout-wise) after 7 days; comments can still accrue
 * indefinitely but are rare on archived content. Anonymous viewers may see
 * up to (s-maxage + swr) of staleness, which is the deliberate tradeoff for
 * the hit-ratio wins.
 *
 * Tiers (agreed with user 2026-04-05):
 *   < 1d     : 60s / 300s     (active editing, voting)
 *   1-7d     : 1h  / 1d        (in payout window)
 *   7-30d    : 1d  / 7d        (paid out, comments still active)
 *   30-60d   : 30d / 7d        (stable archive)
 *   > 60d    : 30d / 60d       (ancient — softer cap than 1y for bounded staleness)
 */
export function getEntryTierForAge(ageMs: number): CachePolicy {
  if (ageMs < 0) {
    // Future-dated (shouldn't happen) — treat as fresh
    return { tier: "entry-fresh", sMaxAge: 60, staleWhileRevalidate: 300 };
  }
  const ageDays = ageMs / DAY_MS;
  if (ageDays < 1) {
    return { tier: "entry-fresh", sMaxAge: 60, staleWhileRevalidate: 300 };
  }
  if (ageDays < 7) {
    return { tier: "entry-week", sMaxAge: 3600, staleWhileRevalidate: 86400 };
  }
  if (ageDays < 30) {
    return { tier: "entry-month", sMaxAge: 86400, staleWhileRevalidate: 604800 };
  }
  if (ageDays < 60) {
    return { tier: "entry-archive", sMaxAge: 2592000, staleWhileRevalidate: 604800 };
  }
  return { tier: "entry-ancient", sMaxAge: 2592000, staleWhileRevalidate: 5184000 };
}

/**
 * Extract author and permlink from an entry-page URL.
 *
 * Matches:
 *   /:category/@author/:permlink          → {category, author, permlink}
 *   /:category/@author/:permlink/:sub     → {category, author, permlink}
 *   /@author/:permlink                    → {author, permlink} (rewrites to /entry/created/...)
 *
 * Excludes profile sections (/@author/posts, /@author/wallet, etc.) which
 * have exactly 2 segments where the second is a known section.
 */
export function parseEntryUrl(
  path: string
): { author: string; permlink: string } | null {
  // Strip trailing slash
  const p = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  const segments = p.split("/").filter(Boolean);

  // /:category/@author/:permlink[/...]
  if (segments.length >= 3 && segments[1].startsWith("@")) {
    const author = segments[1].slice(1);
    const permlink = segments[2];
    if (author && permlink) return { author, permlink };
  }

  // /@author/:permlink (rewrites to entry)
  if (segments.length === 2 && segments[0].startsWith("@")) {
    const second = segments[1];
    if (
      NO_CACHE_PROFILE_SECTIONS.has(second) ||
      PROFILE_FEED_SECTIONS.has(second) ||
      ["posts", "blog", "comments", "replies", "communities", "insights", "rss", "rss.xml"].includes(second)
    ) {
      return null; // profile section, not an entry
    }
    const author = segments[0].slice(1);
    if (author) return { author, permlink: second };
  }

  return null;
}
