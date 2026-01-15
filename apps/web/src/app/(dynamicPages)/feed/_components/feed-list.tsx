"use client";

import React, { useMemo } from "react";
import { usePostsFeedQuery } from "@/api/queries";
import { Entry, SearchResponse } from "@/entities";
import type { UseInfiniteQueryResult, InfiniteData } from "@tanstack/react-query";
import {
  DetectBottom,
  EntryListContent,
  EntryListContentLoading,
  EntryListContentNoData
} from "@/features/shared";
import { EcencyConfigManager } from "@/config";
import { getPromotedPostsQuery } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

interface Props {
  filter: string;
  tag: string;
  observer?: string;
  now?: number;
}

type Page = Entry[] | SearchResponse;

export function FeedList({ filter, tag, observer, now }: Props) {
  const visionFeatures = EcencyConfigManager.CONFIG.visionFeatures;

  // Fetch promoted posts if feature is enabled and get the data
  const { data: promotedPosts } = useQuery({
    ...getPromotedPostsQuery(),
    enabled: visionFeatures.promotions.enabled
  });

  // Single source of truth - one query call
  const { data, fetchNextPage, isLoading, isFetching, isFetchingNextPage } =
    usePostsFeedQuery(filter, tag, observer) as UseInfiniteQueryResult<Page, Error>;

  // Extract entries from all pages (no skipping - simpler and works with client-side navigation)
  const entries = useMemo(() => {
    const pages = (data as InfiniteData<Page, unknown> | undefined)?.pages ?? [];
    const relevantPages = pages;

    const extracted = relevantPages.flatMap((page) =>
      Array.isArray(page) ? page : ((page as any).items ?? (page as any).results ?? [])
    );

    return extracted;
  }, [data, filter, tag, observer]); // Include filter/tag/observer to ensure recalc on param changes

  // Simple, clear loading and empty state logic
  const isLoadingData = isLoading || (isFetching && entries.length === 0);
  const isEmpty = !isLoading && !isFetching && entries.length === 0;
  const showLoading = isLoadingData || isFetchingNextPage;

  // Check if this is a global feed (should never show empty state)
  // Global feed = trending/hot/created/payout/muted/promoted (always has content)
  const isGlobalFeed = ["trending", "hot", "created", "payout", "muted", "promoted"].includes(filter) && tag !== "my";

  // Only show empty state for personalized feeds, never for global feeds
  const shouldShowEmpty = isEmpty && !isGlobalFeed;

  // Only allow pagination after initial data is loaded
  const handleLoadMore = () => {
    // Don't fetch next page if:
    // 1. Still loading initial data
    // 2. Already fetching
    // 3. No entries loaded yet (prevents early pagination)
    if (isLoading || isFetching || entries.length === 0) {
      return;
    }
    fetchNextPage();
  };

  return (
    <>
      {/* Show all entries */}
      <EntryListContent
        username=""
        loading={false}
        entries={entries}
        sectionParam={filter}
        isPromoted={visionFeatures.promotions.enabled}
        promotedEntries={promotedPosts ?? []}
        showEmptyPlaceholder={false}
        now={now}
      />

      {/* Show empty state ONLY for personalized feeds, never for global feeds */}
      {shouldShowEmpty && (
        <EntryListContentNoData username="" loading={false} section={filter} />
      )}

      {/* Infinite scroll trigger - only active after initial load */}
      <DetectBottom onBottom={handleLoadMore} />

      {/* Loading indicator - single instance */}
      {showLoading && <EntryListContentLoading />}
    </>
  );
}
