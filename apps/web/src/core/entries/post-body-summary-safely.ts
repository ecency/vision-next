import { postBodySummary } from "@ecency/render-helper";
import { reportRenderHelperFailureOnce } from "./report-render-helper-failure";

/**
 * `postBodySummary`, degraded to "this post has no summary" when it throws.
 *
 * The twin of catch-post-image-safely, for the other author-controlled string
 * every card renders. Both run in the same place and for the same reason: the
 * card summary is computed during the SSR render of the feed, profile and
 * community routes. Since those routes stopped shipping a loading module
 * (#1786 and its siblings) there is no Suspense boundary anywhere above the
 * cards - and no error.tsx either. React's server renderer recovers a throw
 * only AT a Suspense boundary; a class error boundary above it does nothing on
 * the server. So on these routes a throw out of this call is not a missing line
 * of text under a title, it is the whole document erroring into global-error.
 *
 * Feed rows are normally slimmed to `body: ""` (core/entries/slim-entry.ts),
 * which starves the markdown renderer, but four paths carry a full body here:
 *   - `slimEntrySafely` hands back the un-slimmed entry when slimming throws,
 *   - the comments/replies profile sections keep their bodies by design
 *     (BODY_BACKED_SECTIONS in api/queries/get-account-posts-feed-query.ts,
 *     reachable as /feed/comments/@user and /feed/replies/@user),
 *   - the profile's pinned entry is fetched through the post cache, unslimmed,
 *   - search rows are never slimmed at all.
 * And the slimmer itself calls this to DERIVE `description`, inside the
 * queryFn, on the full body of every row of every ranked feed.
 *
 * What can throw, precisely: the package catches around its own markdown
 * render, but not around the steps on either side of it. `cleanReply` runs
 * first and throws `TypeError: s.replace is not a function` outright on an
 * `entry.body` that is not a string; `decodeEntities` runs last and used to
 * raise a RangeError on an overlong numeric character reference (fixed at its
 * source, the same story catch-post-image-safely tells). Neither is the reason
 * this exists - the reason is that a markdown pipeline over untrusted on-chain
 * text sits on the SSR path of the busiest routes with nothing above it.
 *
 * Returning "" is what every caller already handles: the card renders an empty
 * summary line under its title, while `slimEntry`'s pickDescription falls back
 * to the post title, so a broken post still lists as a readable row.
 */
export function postBodySummarySafely(...args: Parameters<typeof postBodySummary>): string {
  try {
    return postBodySummary(...args) ?? "";
  } catch (e) {
    reportRenderHelperFailureOnce("postBodySummary", args[0], e);
    return "";
  }
}
