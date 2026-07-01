import { cookies } from "next/headers";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { prefetchGetPostsFeedQuery } from "@/api/queries";
import { FeedLayout, FeedList } from "../_components";
import React from "react";
import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";
import { generateFeedMetadata } from "@/app/(dynamicPages)/feed/[...sections]/_helpers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, prefetchQuery } from "@/core/react-query";
import {
  stripActiveVotesFromDehydratedState,
  stripActiveVotesFromValue
} from "@/core/react-query/strip-active-votes";
import { getPromotedPostsQuery } from "@ecency/sdk";
import { EcencyConfigManager } from "@/config";
import { EntryListContent } from "@/features/shared/entry-list-content";
import { EntryArchivePager } from "@/features/shared/entry-archive-pager";
import {
  ARCHIVE_PAGE_SIZE,
  cursorToken,
  fetchRankedCursorPage,
  isArchivableTag,
  parseArchiveCursor
} from "@/features/seo/ranked-archive";
import { Entry } from "@/entities";

interface Props {
  params: Promise<{ sections: string[] }>;
  searchParams: Promise<Record<string, string>>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { sections } = await props.params;
  const { before } = await props.searchParams;
  const [filter = "hot", rawTag = ""] = sections;
  const tag = rawTag === "global" ? "" : rawTag;
  const cursor = isArchivableTag(filter, tag) ? parseArchiveCursor(before) : null;
  return generateFeedMetadata(filter, tag, cursor ? cursorToken(cursor) : undefined);
}

export default async function FeedPage({ params, searchParams }: Props) {
  const [filter = "hot", rawTag = ""] = (await params).sections;
  const tag = rawTag === "global" ? "" : rawTag;
  const { before } = await searchParams;

  const cookiesStore = await cookies();
  // observer is for filtering muted users/content - always use logged-in user or "ecency"
  const loggedInUser = cookiesStore.get(ACTIVE_USER_COOKIE_NAME)?.value;
  const observer = loggedInUser || "ecency";

  const basePath = `/${filter}/${tag}`;
  const cursor = isArchivableTag(filter, tag) ? parseArchiveCursor(before) : null;

  // Cursor archive page: one O(1) fetch of the 20 posts older than the cursor,
  // fully server-rendered (no infinite scroll) with a crawlable pager.
  if (cursor) {
    const { entries, nextCursor } = await fetchRankedCursorPage(filter, tag, cursor, observer);
    if (entries.length === 0) {
      return redirect(basePath); // stale/invalid cursor -> clean first page
    }
    return (
      <HydrationBoundary
        state={stripActiveVotesFromDehydratedState(dehydrate(getQueryClient()), loggedInUser)}
      >
        <FeedLayout tag={tag} filter={filter} observer={observer}>
          <EntryListContent
            username=""
            loading={false}
            entries={stripActiveVotesFromValue(entries, loggedInUser)}
            sectionParam={filter}
            isPromoted={false}
            showEmptyPlaceholder={false}
          />
          <EntryArchivePager
            basePath={basePath}
            olderCursor={nextCursor ? cursorToken(nextCursor) : null}
            showLatest={true}
          />
        </FeedLayout>
      </HydrationBoundary>
    );
  }

  // Default (page 1): prefetch for hydration; add a crawlable "Older" link into
  // the cursor chain when the first page is full (infinite scroll = JS path).
  const feed = await prefetchGetPostsFeedQuery(filter, tag, 20, observer);

  // Only prefetch promoted posts if promotions feature is enabled
  if (EcencyConfigManager.CONFIG.visionFeatures.promotions.enabled) {
    await prefetchQuery(getPromotedPostsQuery());
  }

  const firstPage = ((feed?.pages?.[0] as Entry[] | undefined) ?? []).filter(Boolean);
  const lastOfFirst = firstPage[firstPage.length - 1];
  const olderCursor =
    isArchivableTag(filter, tag) && firstPage.length >= ARCHIVE_PAGE_SIZE && lastOfFirst
      ? `${lastOfFirst.author}/${lastOfFirst.permlink}`
      : null;

  return (
    <HydrationBoundary
      state={stripActiveVotesFromDehydratedState(dehydrate(getQueryClient()), loggedInUser)}
    >
      <FeedLayout tag={tag} filter={filter} observer={observer}>
        <FeedList filter={filter} tag={tag} observer={observer} />
        {olderCursor && (
          <EntryArchivePager basePath={basePath} olderCursor={olderCursor} showLatest={false} />
        )}
      </FeedLayout>
    </HydrationBoundary>
  );
}
