/**
 * Cache policy resolution for HTML responses.
 *
 * Returns the Cache-Control tier that should be applied to a given pathname,
 * or null if no policy applies (middleware will leave the response untouched).
 *
 * Entry (post) pages use a single conservative tier from the URL alone.
 * Per-post-age refinement (30d for old posts, etc.) should be done at the
 * Cloudflare worker layer, which can fetch post metadata on cache-miss and
 * rewrite Cache-Control based on the post's created date. See
 * docs/cache/cloudflare-worker.md.
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

/** Static content pages — effectively permanent. */
const STATIC_PAGES = new Set([
  "/faq",
  "/about",
  "/child-safety",
  "/contributors",
  "/privacy-policy",
  "/terms-of-service",
  "/whitepaper",
  "/guest-post",
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
