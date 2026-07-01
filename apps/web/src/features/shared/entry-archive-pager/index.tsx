import Link from "next/link";
import { initI18next } from "@/features/i18n";
import i18next from "i18next";

interface Props {
  /** Base archive URL without a query, e.g. "/@enjar/posts". */
  basePath: string;
  /** Cursor token ("author/permlink") for the next (older) page, or null. */
  olderCursor: string | null;
  /** Show a "back to latest" link (true on cursor pages, false on page 1). */
  showLatest: boolean;
}

export interface PagerState {
  showLatest: boolean;
  latestHref: string;
  showOlder: boolean;
  olderHref: string;
}

/**
 * Pure pager resolution, so the routing logic is unit-testable without rendering
 * the async server component. Page 1 is the clean base URL; older pages are
 * `${base}?before=<cursor>`. Returns null when there's nothing to link.
 */
export function resolvePager(
  basePath: string,
  olderCursor: string | null,
  showLatest: boolean
): PagerState | null {
  const showOlder = !!olderCursor;
  if (!showLatest && !showOlder) {
    return null;
  }
  return {
    showLatest,
    latestHref: basePath,
    showOlder,
    olderHref: olderCursor ? `${basePath}?before=${olderCursor}` : basePath
  };
}

/**
 * Crawlable cursor pager for archive pages. Server-rendered `<a>` links give
 * crawlers a durable, O(1)-per-page path through an author/community/tag's full
 * history (the "Older" link carries the next cursor). Section-agnostic copy.
 */
export async function EntryArchivePager({ basePath, olderCursor, showLatest }: Props) {
  const state = resolvePager(basePath, olderCursor, showLatest);
  if (!state) {
    return null;
  }

  await initI18next();
  const linkClass =
    "text-sm px-3 py-1.5 rounded-lg border border-[--border-color] hover:bg-blue-dark-sky-040 dark:hover:bg-gray-900";

  return (
    <nav
      aria-label={i18next.t("archive-pager.label")}
      className="entry-archive-pager flex items-center justify-between gap-3 my-6"
    >
      {state.showLatest ? (
        <Link href={state.latestHref} className={linkClass}>
          {i18next.t("archive-pager.latest")}
        </Link>
      ) : (
        <span />
      )}
      {state.showOlder ? (
        <Link href={state.olderHref} rel="next" className={linkClass}>
          {i18next.t("archive-pager.older")}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
