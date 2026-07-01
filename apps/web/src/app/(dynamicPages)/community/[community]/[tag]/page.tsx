import { getCommunityCache } from "@/core/caches";
import { notFound, redirect } from "next/navigation";
import { prefetchGetPostsFeedQuery } from "@/api/queries";
import { EntryListContent } from "@/features/shared/entry-list-content";
import { EntryArchivePager } from "@/features/shared/entry-archive-pager";
import { LinearProgress } from "@/features/shared/linear-progress";
import { dehydrate, HydrationBoundary, InfiniteData } from "@tanstack/react-query";
import { getQueryClient, prefetchQuery } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateCommunityMetadata } from "@/app/(dynamicPages)/community/[community]/_helpers";
import { CommunityContentSearch } from "../_components/community-content-search";
import { ProfileEntriesLayout } from "@/app/(dynamicPages)/profile/[username]/_components/profile-entries-layout";
import { CommunityContentInfiniteList } from "../_components/community-content-infinite-list";
import { Entry, SearchResponse } from "@/entities";
import {
  ARCHIVE_PAGE_SIZE,
  cursorToken,
  fetchRankedCursorPage,
  isArchivableFilter,
  parseArchiveCursor
} from "@/features/seo/ranked-archive";

type Page = Entry[] | SearchResponse;

interface Props {
  params: Promise<{ tag: string; community: string }>;
  searchParams: Promise<Record<string, string>>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { community, tag } = await props.params;
  const { before } = await props.searchParams;
  const cursor = isArchivableFilter(tag) ? parseArchiveCursor(before) : null;
  return generateCommunityMetadata(community, tag, cursor ? cursorToken(cursor) : undefined);
}

function pageToEntries(p: Page): Entry[] {
  if (Array.isArray(p)) return p;
  // Adjust these fallbacks to match your SearchResponse shape
  return (p as any).items ?? (p as any).results ?? [];
}

export default async function CommunityPostsPage({ params, searchParams }: Props) {
  const { community, tag } = await params;
  const { before } = await searchParams;
  const basePath = `/${tag}/${community}`;
  const cursor = isArchivableFilter(tag) ? parseArchiveCursor(before) : null;

  // Cursor archive page: one O(1) fetch of the 20 posts older than the cursor,
  // fully server-rendered (no infinite scroll) with a crawlable pager.
  if (cursor) {
    const [communityData, archive] = await Promise.all([
      prefetchQuery(getCommunityCache(community)),
      fetchRankedCursorPage(tag, community, cursor)
    ]);
    if (!communityData) return notFound();
    if (archive.entries.length === 0) return redirect(basePath); // stale cursor

    return (
      <HydrationBoundary state={dehydrate(getQueryClient())}>
        <ProfileEntriesLayout section={tag} username={community}>
          <EntryListContent
            community={communityData}
            username={community}
            isPromoted={false}
            entries={archive.entries}
            loading={false}
            sectionParam={tag}
          />
          <EntryArchivePager
            basePath={basePath}
            olderCursor={archive.nextCursor ? cursorToken(archive.nextCursor) : null}
            showLatest={true}
          />
        </ProfileEntriesLayout>
      </HydrationBoundary>
    );
  }

  const [communityData, data] = await Promise.all([
    prefetchQuery(getCommunityCache(community)),
    prefetchGetPostsFeedQuery(tag, community)
  ]);

  if (!communityData) return notFound();

  if (!data || !Array.isArray(data.pages) || data.pages.length === 0) {
    return null;
  }

  const flatEntries = data.pages.flatMap(pageToEntries);
  // Crawlable "Older" entry into the cursor chain when page 1 is full.
  const firstPage = pageToEntries((data as InfiniteData<Page, unknown>).pages[0]);
  const lastOfFirst = firstPage[firstPage.length - 1];
  const olderCursor =
    isArchivableFilter(tag) && firstPage.length >= ARCHIVE_PAGE_SIZE && lastOfFirst
      ? `${lastOfFirst.author}/${lastOfFirst.permlink}`
      : null;

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {data.pages.length === 0 ? <LinearProgress /> : null}

      {isArchivableFilter(tag) && data.pages.length > 0 && (
        <div className="searchProfile">
          <CommunityContentSearch community={communityData} filter={tag} />
        </div>
      )}

      <ProfileEntriesLayout section={tag} username={community}>
        <EntryListContent
          community={communityData}
          username={community}
          isPromoted={false}
          entries={flatEntries}
          loading={false}
          sectionParam={tag}
        />
        <CommunityContentInfiniteList community={communityData} section={tag} />
        {olderCursor && (
          <EntryArchivePager basePath={basePath} olderCursor={olderCursor} showLatest={false} />
        )}
      </ProfileEntriesLayout>
    </HydrationBoundary>
  );
}
