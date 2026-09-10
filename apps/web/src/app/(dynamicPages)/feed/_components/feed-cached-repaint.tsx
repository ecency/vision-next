"use client";

import { PropsWithChildren, useMemo, useSyncExternalStore } from "react";
import type { InfiniteData } from "@tanstack/react-query";
import { getPostsFeedQueryData } from "@/api/queries";
// Straight from the module, not the `_helpers` barrel: that also carries the
// route's metadata builders, which have no business in a client bundle.
import { normalizeFeedTag } from "@/app/(dynamicPages)/feed/[...sections]/_helpers/feed-tag";
import { DEFAULT_OBSERVER } from "@/consts/observer";
import { getQueryClient } from "@/core/react-query";
import { useGlobalStore } from "@/core/global-store";
import { Entry, SearchResponse } from "@/entities";
import { ListStyle } from "@/enums";
import { EntryListContent } from "@/features/shared/entry-list-content";
import { useVisibleEntries } from "@/features/shared/entry-list-item/use-muted-authors";
import { LinearProgress } from "@/features/shared/linear-progress";
import { useFeedNavigationTarget, type FeedNavigationTarget } from "./feed-navigation-intent";

type Page = Entry[] | SearchResponse;

/**
 * The reader's already-cached rows for the feed they are navigating TO, painted
 * while that navigation is in flight.
 *
 * `core/react-query/persist.ts` restores page 1 of the posts-ranked and
 * account-posts families from IndexedDB precisely so a reader returning to a
 * feed sees rows immediately. Until #1786 the thing that painted them was
 * `FeedLoading`, the route's `loading.tsx` fallback — and that fallback was a
 * Suspense boundary above the cards, which cost this route roughly 7s of LCP on
 * a throttled phone. The boundary had to go; the repaint did not have to go
 * with it, it just had nowhere else to live (#1789).
 *
 * So this is the same cache read, the same muted-author filter and the same
 * no-reblog filter as the deleted component, moved from a route fallback to a
 * plain wrapper around `{children}` in the feed layout. No boundary, no
 * `loading.tsx`, and — the load-bearing property — NOTHING at all in the server
 * render: `getServerSnapshot` on both stores returns nothing, so SSR emits
 * `{children}` and only `{children}`.
 *
 * ONE deliberate difference from FeedLoading. That component fell back to
 * `ReadingListLoading` — six skeleton rows — when the cache was empty, because
 * a route fallback replaces the screen whether it has anything to say or not.
 * A wrapper is not obliged to, and skeletons here would be strictly worse than
 * doing nothing: today's soft navigation keeps the previous feed on screen
 * under the app-wide progress bar, and swapping a real page for grey rectangles
 * is a downgrade. So an empty cache renders `{children}` untouched and the
 * reader keeps the behaviour they have now. The repaint only ever ADDS content.
 *
 * What the reader sees when it does fire is what the destination itself paints
 * first: the page hydrates against this same query key, so the swap at the end
 * of the navigation is the cached rows being replaced by the server's fresher
 * copy of the same feed — not a second full page change.
 */
export function FeedCachedRepaint({ children }: PropsWithChildren) {
  const target = useFeedNavigationTarget();
  const listStyle = useGlobalStore((state) => state.listStyle);
  const activeUsername = useGlobalStore((state) => state.activeUser?.username);
  const observer = activeUsername || DEFAULT_OBSERVER;

  // Normalised exactly as the page normalises it, or the key looked up here is
  // not the key the feed was stored under: /hot/Photography is served as the
  // `photography` feed, and a tag hivemind cannot answer was never queried at
  // all, so any hit under it would belong to a different feed.
  const feed = useMemo(() => resolveFeed(target), [target]);

  const cached = useSyncExternalStore(
    (onChange) => getQueryClient().getQueryCache().subscribe(onChange),
    // Returns the cached object itself, never a derived array: a fresh array
    // per call would make React see a new snapshot on every render and loop.
    () => (feed ? getPostsFeedQueryData(feed.filter, feed.tag, 20, observer) : undefined),
    () => undefined
  );

  const entries = useMemo(() => {
    const firstPage = (cached as InfiniteData<Page, unknown> | undefined)?.pages?.[0];
    const rows = (Array.isArray(firstPage) ? firstPage : []).filter(Boolean);
    return target?.noReblog
      ? rows.filter((row) => !row.reblogged_by || row.reblogged_by.length === 0)
      : rows;
  }, [cached, target?.noReblog]);

  // Counted on what the reader can actually see: a cached page of nothing but
  // muted authors is an empty page, and an empty page is not worth painting.
  const visibleEntries = useVisibleEntries(entries);

  if (!feed || visibleEntries.length === 0) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Hidden, not unmounted. The destination re-renders this subtree the
          moment the RSC response lands, and tearing the old page's DOM down
          and back up in between would throw away every card's hydration for
          the sake of a second. */}
      <div hidden>{children}</div>
      <div className="entry-list" data-feed-repaint={`${feed.filter}/${feed.tag}`}>
        <div
          className={`entry-list-body ${listStyle === ListStyle.grid ? "grid-view" : ""}`}
          aria-busy="true"
        >
          <LinearProgress />
          <EntryListContent
            username=""
            loading={false}
            entries={visibleEntries}
            sectionParam={feed.filter}
            isPromoted={false}
            showEmptyPlaceholder={false}
          />
        </div>
      </div>
    </>
  );
}

function resolveFeed(
  target: FeedNavigationTarget | null
): { filter: string; tag: string } | null {
  if (!target) {
    return null;
  }
  const { tag, queryable } = normalizeFeedTag(target.tag);
  return queryable ? { filter: target.filter, tag } : null;
}
