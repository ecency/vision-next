import { catchPostImage } from "@ecency/render-helper";
import { sentry } from "@/core/sentry/lazy-sentry";

/**
 * `catchPostImage`, degraded to "this post has no thumbnail" when it throws.
 *
 * The call is not optional-extra work: feed cards, the feed thumbnail preload
 * and search rows all make it during the SSR render, outside any Suspense
 * boundary, so a throw is a blank route rather than a missing image. And it
 * can throw on author-controlled input — `sanitizeHtml` decoded numeric
 * character references with a bare `String.fromCodePoint`, so a body carrying
 * `<div title="&#x110000;">` raised a RangeError from inside the extractor
 * (fixed in @ecency/render-helper, but the apps consume that package through
 * its COMMITTED dist, which is only rebuilt on a release — until then this
 * guard is the only thing standing between one crafted post and a 500).
 *
 * Feed rows are normally slimmed to `body: ""`, which starves the markdown
 * tier, but three paths carry a full body to these calls: `slimEntrySafely`
 * handing back the un-slimmed entry when slimming throws, the
 * comments/replies profile sections (BODY_BACKED_SECTIONS, reachable as
 * /feed/comments/@user), and the profile's pinned entry, which is fetched
 * through the post cache and never slimmed.
 *
 * Returning null is exactly what these components already handle: the
 * thumbnail falls back to the noimage placeholder (or hides itself for a
 * comment), the preload emits no <link>, the search row shows its placeholder.
 */
export function catchPostImageSafely(
  ...args: Parameters<typeof catchPostImage>
): string | null {
  try {
    return catchPostImage(...args);
  } catch (e) {
    reportOnce(e, args[0]);
    return null;
  }
}

// One broken post is one issue. The extractor is deterministic, so a body that
// throws throws on every render — server, hydration, and every re-render of
// the row it sits in — and the same entry is passed to several of these call
// sites per page. Report the first failure per post and stay quiet after that.
// Only posts that already failed are ever keyed here, and the set is cleared
// once it grows past a sane cap.
const reportedFailures = new Set<string>();

function failureKey(obj: Parameters<typeof catchPostImage>[0]): string {
  // The search row passes a raw body string, with no author/permlink to key on.
  return typeof obj === "string"
    ? `body:${obj.length}:${obj.slice(0, 200)}`
    : `entry:${obj?.author}/${obj?.permlink}`;
}

function reportOnce(e: unknown, obj: Parameters<typeof catchPostImage>[0]) {
  const key = failureKey(obj);

  if (reportedFailures.has(key)) {
    return;
  }

  if (reportedFailures.size >= 100) {
    reportedFailures.clear();
  }

  reportedFailures.add(key);

  const context = { extra: { where: "catchPostImage", entry: key } };

  if (typeof window === "undefined") {
    // Server render. The lazy facade is only ever configured in the browser
    // (sentry.client.config.ts), so a capture through it here would be
    // buffered and never sent — and the server is where this failure actually
    // costs a page. Load the real SDK on demand instead: the import stays out
    // of the eager client graph because this branch is unreachable there, so
    // the feed's client chunks do not gain @sentry/nextjs.
    void import("@sentry/nextjs")
      .then((Sentry) => Sentry.captureException(e, context))
      .catch(() => {
        /* reporting must never be the thing that breaks the render */
      });
    return;
  }

  sentry.captureException(e, context);
}
