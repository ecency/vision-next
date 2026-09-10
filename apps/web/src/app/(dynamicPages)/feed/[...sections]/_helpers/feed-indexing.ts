/**
 * Canonical target and indexability for the feed catch-all.
 *
 * `/feed/[...sections]` is reached under several spellings, and the metadata
 * used to assume there was only one: it built the canonical as `/{filter}` or
 * `/{filter}/{tag}` straight from the route's own params. For a ranked feed
 * those ARE the public URLs, but for an account feed they are not URLs at all.
 * `/@user/feed` rewrites to `/feed/feed/:author`, so `{filter}` is `feed` and
 * every personal feed self-canonicalised to `https://ecency.com/feed`, which
 * 404s; `/feed/comments/@user` claimed `/comments`, also a 404 (#1800).
 *
 * The spellings this route answers to, and where each one now points:
 *
 *   requested URL              route params              canonical
 *   ---------------------------------------------------------------------------
 *   /trending                  ["trending"]              itself
 *   /created/photography       ["created","photography"] itself
 *   /tags/photography          ["created","photography"] /created/photography
 *   /@user/feed                ["feed","%40user"]        /@user/feed    (noindex)
 *   /feed/feed/@user           ["feed","%40user"]        /@user/feed    (noindex)
 *   /feed/comments/@user       ["comments","%40user"]    /@user/comments
 *   /feed/payout/@user         ["payout","%40user"]      itself         (noindex)
 *
 * Two rules produce that table:
 *
 * 1. A canonical must name a URL that resolves. Where the page has a prettier
 *    public spelling (`/@user/feed` for the rewrite target, `/@user/comments`
 *    for the account sort the profile route serves from the same
 *    bridge.get_account_posts rows) the canonical names that; otherwise it
 *    names the route path itself, which always resolves.
 * 2. The following feed stays OUT of the index. It is a personalised list of
 *    other people's posts — no text of its own, one URL per account, and empty
 *    for an account that follows nobody. `follow` is deliberate: crawlers
 *    should still walk it to the posts themselves. Verified before the change:
 *    no `/…/feed` URL has had a single Search impression, and Search Console
 *    reports `/@ecency/feed` and `/@good-karma/feed` as unknown to Google, so
 *    nothing is being removed from the index.
 *
 * The account sorts in rule 1 keep no robots directive of their own: they
 * canonicalise ONTO a page we do want indexed, and a noindex on a duplicate can
 * carry over to its canonical target.
 */

/** Sorts the public URL space spells `/{filter}` and `/{filter}/{tag}` (next.config.js rewrites). */
const RANKED_FILTERS = new Set(["hot", "created", "trending", "payout", "muted", "promoted"]);

/** Account sorts the profile route already serves at `/@user/{section}`. */
const PROFILE_SECTION_SORTS = new Set(["posts", "blog", "comments", "replies"]);

/**
 * The `@` of an account feed reaches this route percent-encoded — the
 * next.config.js rewrite encodes the segment it captures — but a directly
 * requested `/feed/comments/@user` carries a literal `@`. Both spellings are
 * the same feed; every other reader on this route (feed-tag.ts,
 * feed-layout.tsx, use-feed-menu.ts) already accepts either.
 */
const ACCOUNT_TAG_PREFIX = /^(?:@|%40)/i;

const NOINDEX = "noindex, follow";

/** The account an account-feed tag names, or "" when the tag is a topic tag. */
export function accountFeedUsername(tag: string): string {
  return ACCOUNT_TAG_PREFIX.test(tag) ? tag.replace(ACCOUNT_TAG_PREFIX, "") : "";
}

/**
 * The route's own path. The one spelling that resolves for every filter, and
 * spelled decoded: middleware 307s `/feed/comments/%40user` onto the `@` form.
 */
function feedRoutePath(filter: string, tag: string): string {
  const segment = tag.replace(/%40/gi, "@");
  return `/feed/${filter}${segment ? `/${segment}` : ""}`;
}

export interface FeedIndexing {
  /** Path the canonical points at, without the origin. Always resolves. */
  path: string;
  /** `robots` value when this URL must stay out of the index; absent otherwise. */
  robots?: string;
}

export function feedIndexing(filter: string, tag: string): FeedIndexing {
  const username = accountFeedUsername(tag);

  // Following feed — see rule 2. Without an account there is no `/@user/feed`
  // to name, only the bare rewrite target.
  if (filter === "feed") {
    return {
      path: username ? `/@${username}/feed` : feedRoutePath(filter, tag),
      robots: NOINDEX
    };
  }

  if (username) {
    // Same rows as the profile section under a second URL: consolidate onto it.
    if (PROFILE_SECTION_SORTS.has(filter)) {
      return { path: `/@${username}/${filter}` };
    }
    // An account sort with no profile page of its own (payout), or a sort
    // hivemind will refuse: reachable, empty or near-duplicate, not indexable.
    return { path: feedRoutePath(filter, tag), robots: NOINDEX };
  }

  // Ranked feeds keep exactly the canonical they have always had.
  if (RANKED_FILTERS.has(filter)) {
    return { path: tag ? `/${filter}/${tag}` : `/${filter}` };
  }

  // Not a sort the public URL space spells: `/{filter}` is a 404.
  return { path: feedRoutePath(filter, tag), robots: NOINDEX };
}
