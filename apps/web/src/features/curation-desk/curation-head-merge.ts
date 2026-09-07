import type { InfiniteData } from "@tanstack/react-query";
import type { CurationFeedPage, CurationRosterFeedPage, CurationSort } from "@ecency/sdk";
import { isChronological } from "./curation-queue-display";
import { parseChainDate } from "./curation-window";
import type { DeskRow } from "./types";

type AnyPage = CurationFeedPage | CurationRosterFeedPage;

/** Row-wise `(created, post_id)`, the key both chronological sorts page on. */
function compare(a: DeskRow, b: DeskRow): number {
  const at = parseChainDate(a.created) ?? 0;
  const bt = parseChainDate(b.created) ?? 0;
  if (at !== bt) return at - bt;
  return a.post_id - b.post_id;
}

/**
 * Merge a freshly fetched page one into the loaded pages, keeping every later
 * page and every page param.
 *
 * The head refresh used to replace the whole loaded set with the new page one.
 * That is what threw a curator's scroll position away: react-virtuoso indexes
 * by position, so an item array falling from N*25 back to 25 collapses the
 * view to the top. At roughly 838 posts a day the head moves constantly, so a
 * curator working the older end of the queue lost their place again and again.
 *
 * Two rules make the merge safe:
 *
 * - **Server truth wins inside the refreshed window.** A row the loaded page
 *   one held between the refreshed page's first and last key, which the
 *   refreshed page no longer carries, has left the queue (curated, marked, or
 *   passed by the team cursor) and is dropped. Rows outside that window are
 *   kept: they are what the later pages continue from.
 * - **A gap is not merged.** If the refreshed page does not reach the loaded
 *   page one at all, more than a page of posts arrived in between and splicing
 *   the two runs together would silently swallow everything between them. That
 *   falls back to replacing, which is what this function did in every case
 *   before.
 *
 * Rows the merge does not change are returned as the SAME object, so the
 * memoized rows skip their render and the tick's identity contract holds.
 */
export function mergeHeadPage<TPage extends AnyPage>(
  data: InfiniteData<TPage, unknown> | undefined,
  page: TPage,
  sort: CurationSort
): InfiniteData<TPage, unknown> | undefined {
  if (!data) return data;
  /** What this did in every case before: page one alone, later pages dropped. */
  const replace = (): InfiniteData<TPage, unknown> => ({
    ...data,
    pages: [page] as TPage[],
    pageParams: data.pageParams.slice(0, 1),
  });
  const loaded = data.pages[0];
  // A non-chronological order has no key to merge on: `unique` reranks and
  // `random` is seeded, so the union of two pages is not a queue.
  if (!isChronological(sort) || !loaded || loaded.items.length === 0) return replace();
  // An empty page one is a successful answer, not a no-op: under keyset paging the
  // later pages start after it, so nothing can be below it either. The queue really
  // is empty, and keeping the loaded rows would leave posts on screen that the server
  // no longer serves and that still look actionable.
  if (page.items.length === 0) return replace();

  const fresh = page.items as DeskRow[];
  const old = loaded.items as DeskRow[];
  const freshIds = new Set(fresh.map((r) => r.post_id));

  // The window the refreshed page speaks for, whichever direction it is in.
  let lo = fresh[0];
  let hi = fresh[0];
  for (const row of fresh) {
    if (compare(row, lo) < 0) lo = row;
    if (compare(row, hi) > 0) hi = row;
  }

  /** Strictly outside the range the refreshed page speaks for. */
  const outsideWindow = (row: DeskRow) => compare(row, lo) < 0 || compare(row, hi) > 0;
  /** Inside the window the server is the truth, so a row it no longer carries has left. */
  const survives = (row: DeskRow) => outsideWindow(row) || freshIds.has(row.post_id);
  const kept = old.filter(outsideWindow);
  // Contiguity: the two runs must touch. They do when the refreshed page still
  // holds a row the loaded page held, or when it already covers everything the
  // loaded page had. Otherwise a page or more arrived in between.
  const touches = old.some((row) => freshIds.has(row.post_id)) || kept.length === 0;
  if (!touches) return replace();

  const descending = sort === "newest";
  const merged = [...fresh, ...kept].sort((a, b) => (descending ? compare(b, a) : compare(a, b)));
  // A page one that shrank can leave the refreshed window reaching into page two, so
  // the departures are applied to every loaded page and not only to the first. In the
  // ordinary case the later pages sit below the window and nothing is dropped.
  let laterChanged = false;
  const later = data.pages.slice(1).map((p) => {
    const kept = (p.items as DeskRow[]).filter(survives);
    if (kept.length === p.items.length) return p;
    laterChanged = true;
    return { ...p, items: kept } as TPage;
  });
  // Nothing actually changed: hand back the same objects so no row re-renders.
  if (!laterChanged && merged.length === old.length && merged.every((row, i) => row === old[i])) {
    return data;
  }
  return {
    ...data,
    pages: [{ ...page, items: merged } as TPage, ...later] as TPage[],
    pageParams: data.pageParams,
  };
}
