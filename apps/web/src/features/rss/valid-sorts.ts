/**
 * The sort keys the Hive bridge accepts for a ranked-posts feed
 * (`getPostsRankedInfiniteQueryOptions`). Any other value makes the bridge
 * reject the request with `Assert Exception:Unsupported sort, valid sorts: ...`.
 *
 * Crawlers fan out across our RSS routes with arbitrary first path segments
 * (e.g. `/subscribers/hive-116509/rss.xml`), so both the feed and community RSS
 * handlers must clamp the caller-supplied sort to this set before querying —
 * otherwise the bad sort surfaces as an error-level Sentry issue on every hit.
 */
export const VALID_POST_SORTS = [
  "trending",
  "hot",
  "created",
  "payout",
  "payout_comments",
  "muted"
] as const;

export type PostSort = (typeof VALID_POST_SORTS)[number];

/**
 * Return `sort` when it is a bridge-accepted sort, otherwise fall back to
 * `created` — the safe default that always returns real content, matching the
 * feed/community handler defaults.
 */
export function resolvePostSort(sort: string): string {
  return (VALID_POST_SORTS as readonly string[]).includes(sort) ? sort : "created";
}
