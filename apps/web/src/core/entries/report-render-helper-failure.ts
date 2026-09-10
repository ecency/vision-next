import { sentry } from "@/core/sentry/lazy-sentry";

/**
 * The wrapped render-helper calls, by name.
 *
 * A union rather than a string: this value is both the dedupe key's first half
 * and the Sentry grouping tag, so a typo would quietly split one call site's
 * events in two and defeat the suppression for it.
 */
export type RenderHelperCallSite = "catchPostImage" | "postBodySummary";

/** What a wrapped render-helper call was handed: an entry, or a raw body string. */
export type RenderHelperSubject =
  | { author?: string; permlink?: string }
  | string
  | null
  | undefined;

// The extractors these guards wrap are deterministic, so a body that throws
// throws on every render - server, hydration, every re-render of the row it
// sits in - and the same entry reaches several call sites per page. Report the
// first failure per post and stay quiet after that. Only posts that already
// failed are ever keyed here. The set is cleared once it grows past a sane cap.
//
// Scope, precisely: this set is module state. The server and the browser run
// separate module graphs, so a card that fails during SSR and again during
// hydration produces one event from each. That is the intended floor rather
// than an oversight - the server event is the one that says a route was at
// risk, the browser one says the reader saw it - and two events per broken post
// is what this suppresses a stream of identical ones down to.
const reportedFailures = new Set<string>();

/**
 * The identity of the post (or the raw body) a failure belongs to.
 *
 * The search row passes a raw body string, with no author/permlink to key on.
 * Both ends plus the length, so two different bodies that happen to share an
 * opening paragraph still report separately.
 */
function subjectKey(subject: RenderHelperSubject): string {
  return typeof subject === "string"
    ? `body:${subject.length}:${subject.slice(0, 120)}:${subject.slice(-120)}`
    : `entry:${subject?.author}/${subject?.permlink}`;
}

/**
 * Report one render-helper failure per (call site, post), then stay quiet.
 *
 * `where` is part of the dedupe key rather than only of the payload: a body
 * that breaks the image extractor AND the summary renderer has two separate
 * defects. Dropping the second because the first already fired would hide one
 * of them.
 */
export function reportRenderHelperFailureOnce(
  where: RenderHelperCallSite,
  subject: RenderHelperSubject,
  e: unknown
) {
  const entry = subjectKey(subject);
  const key = `${where}|${entry}`;

  if (reportedFailures.has(key)) {
    return;
  }

  if (reportedFailures.size >= 100) {
    reportedFailures.clear();
  }

  reportedFailures.add(key);

  const context = { extra: { where, entry } };

  if (typeof window === "undefined") {
    // Server render. The lazy facade is only ever configured in the browser
    // (sentry.client.config.ts), so a capture through it here would be
    // buffered and never sent - and the server is where this failure actually
    // costs a page. Load the real SDK on demand instead: the import stays out
    // of the eager client graph because this branch is unreachable there, so
    // the feed's client chunks do not gain @sentry/nextjs.
    void import(/* webpackExports: ["captureException"] */ "@sentry/nextjs")
      .then((Sentry) => Sentry.captureException(e, context))
      .catch(() => {
        /* reporting must never be the thing that breaks the render */
      });
    return;
  }

  sentry.captureException(e, context);
}
