"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
import { ReadingListLoading } from "@/features/shared/reading-layout/reading-list-loading";

type Page = Entry[] | SearchResponse;

/**
 * The feed route's loading state, cache-first.
 *
 * A route-level fallback replaces whatever was on screen the moment a
 * navigation starts, so entering a feed the reader was just looking at used to
 * mean six skeleton rows until the server answered. When the query cache
 * already holds that feed — from this session, or restored from the last one —
 * those rows are what belongs here instead, under the same progress bar. The
 * server render replaces them as soon as it arrives.
 *
 * The cache read goes through `useSyncExternalStore` with a null server
 * snapshot on purpose: this component is also rendered into the streamed HTML,
 * where the per-request cache is empty, and returning rows during hydration
 * that the server never wrote would be a mismatch. A client-side navigation
 * does not hydrate, so there the first render is already the cached one.
 */
export function FeedLoading() {
  const params = useParams<{ sections: string[] }>();
  const searchParams = useSearchParams();
  const activeUsername = useGlobalStore((state) => state.activeUser?.username);
  const listStyle = useGlobalStore((state) => state.listStyle);

  const [filter = "hot", rawTag = ""] = params?.sections ?? [];
  const { tag, queryable } = normalizeFeedTag(rawTag);
  const observer = activeUsername || DEFAULT_OBSERVER;

  const cached = useSyncExternalStore(
    (onChange) => getQueryClient().getQueryCache().subscribe(onChange),
    // Returns the cached object itself, never a derived array: a fresh array per
    // call would make React see a new snapshot on every render and loop.
    () => (queryable ? getPostsFeedQueryData(filter, tag, 20, observer) : undefined),
    () => undefined
  );

  // The same two filters the feed itself applies. A fallback is still the
  // reader's page: a muted author or a reblog they switched off must not appear
  // for the half second before the server render lands.
  const noReblog = searchParams?.get("no-reblog") === "true";
  const entries = useMemo(() => {
    const firstPage = (cached as InfiniteData<Page, unknown> | undefined)?.pages?.[0];
    const rows = (Array.isArray(firstPage) ? firstPage : []).filter(Boolean);
    return noReblog ? rows.filter((row) => !row.reblogged_by || row.reblogged_by.length === 0) : rows;
  }, [cached, noReblog]);

  // Counted on what the reader can actually see: a cached page of nothing but
  // muted authors is an empty page, and belongs in the skeleton branch.
  const visibleEntries = useVisibleEntries(entries);

  if (visibleEntries.length === 0) {
    return <ReadingListLoading showProgress />;
  }

  return (
    <div className="entry-list">
      <div className={`entry-list-body ${listStyle === ListStyle.grid ? "grid-view" : ""}`}>
        <LinearProgress />
        <EntryListContent
          username=""
          loading={false}
          entries={visibleEntries}
          sectionParam={filter}
          isPromoted={false}
          showEmptyPlaceholder={false}
        />
      </div>
    </div>
  );
}
