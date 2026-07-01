import Link from "next/link";
import { initI18next } from "@/features/i18n";
import i18next from "i18next";

interface Props {
  /** Base archive URL without a trailing slash, e.g. "/@enjar/posts". */
  basePath: string;
  /** Current page (1 = the default, unnumbered view). */
  page: number;
  /** Whether a further page exists. */
  hasNext: boolean;
  /** Crawlable depth cap. */
  maxPage: number;
}

export interface PagerState {
  showPrev: boolean;
  showNext: boolean;
  prevHref: string;
  nextHref: string;
}

/**
 * Pure pager resolution (which links to show + their hrefs), so the routing
 * logic is unit-testable without rendering the async server component. Page 1 is
 * the base URL (no `/page/1`); page N>1 is `${base}/page/${n}`. Returns null when
 * there is neither a previous nor a next page.
 */
export function resolvePager(
  basePath: string,
  page: number,
  hasNext: boolean,
  maxPage: number
): PagerState | null {
  const showPrev = page > 1;
  const showNext = hasNext && page < maxPage;
  if (!showPrev && !showNext) {
    return null;
  }
  const href = (n: number) => (n <= 1 ? basePath : `${basePath}/page/${n}`);
  return { showPrev, showNext, prevHref: href(page - 1), nextHref: href(page + 1) };
}

/**
 * Crawlable prev/next pager for numbered archive pages. Server-rendered `<a>`
 * links give crawlers a durable path through an author/community/tag's full
 * history (page 1 is the base URL, page N>1 is `${base}/page/${n}`). Also emits
 * `<link rel="prev|next">` (hoisted to <head>) for crawlers that still use them.
 * Renders nothing when there is neither a previous nor a next page.
 */
export async function EntryArchivePager({ basePath, page, hasNext, maxPage }: Props) {
  const state = resolvePager(basePath, page, hasNext, maxPage);
  if (!state) {
    return null;
  }
  const { showPrev, showNext, prevHref, nextHref } = state;

  await initI18next();
  const linkClass =
    "text-sm px-3 py-1.5 rounded-lg border border-[--border-color] hover:bg-blue-dark-sky-040 dark:hover:bg-gray-900";

  return (
    <>
      {showPrev && <link rel="prev" href={prevHref} />}
      {showNext && <link rel="next" href={nextHref} />}
      <nav
        aria-label={i18next.t("archive-pager.label")}
        className="entry-archive-pager flex items-center justify-between gap-3 my-6"
      >
        {showPrev ? (
          <Link href={prevHref} rel="prev" className={linkClass}>
            {i18next.t("archive-pager.newer")}
          </Link>
        ) : (
          <span />
        )}
        <span className="text-sm opacity-70">{i18next.t("archive-pager.page", { n: page })}</span>
        {showNext ? (
          <Link href={nextHref} rel="next" className={linkClass}>
            {i18next.t("archive-pager.older")}
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  );
}
