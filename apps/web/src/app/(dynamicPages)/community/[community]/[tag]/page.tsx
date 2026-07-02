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
  cursorToken,
  fetchRankedCursorPage,
  isArchivableFilter,
  olderCursorToken,
  parseArchiveCursor
} from "@/features/seo/ranked-archive";
import { JsonLd, buildBreadcrumbJsonLd } from "@/features/structured-data";
import { getServerAppBase } from "@/utils/server-app-base";
import defaults from "@/defaults";

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

  const [communityData, data, base] = await Promise.all([
    prefetchQuery(getCommunityCache(community)),
    prefetchGetPostsFeedQuery(tag, community),
    getServerAppBase()
  ]);

  if (!communityData) return notFound();

  if (!data || !Array.isArray(data.pages) || data.pages.length === 0) {
    return null;
  }

  const flatEntries = data.pages.flatMap(pageToEntries);
  // Crawlable "Older" entry into the cursor chain — `created` only (the SDK
  // re-sorts processed pages by date, so trending/hot cursors would not match
  // bridge rank order, and the created chain already reaches every post).
  // The SDK now keeps every pinned entry, so the processed page length equals
  // the raw page length and the plain full-page gate is exact.
  const firstPage = pageToEntries((data as InfiniteData<Page, unknown>).pages[0]);
  const olderCursor = tag === "created" ? olderCursorToken(firstPage) : null;

  // Desktop SERPs replace the URL-derived trail ("ecency.com > created >
  // hive-NNNNN") with this breadcrumb ("Home > Community Title"). Skipped when
  // the community has no human title — a trail must never surface the raw
  // hive-NNNNN machine id (same policy as buildEntryBreadcrumbs).
  const cleanBase = base.replace(/\/+$/, "");
  const communityTitle = communityData.title?.trim();
  const breadcrumbJsonLd = communityTitle
    ? buildBreadcrumbJsonLd([
        { name: defaults.name, url: cleanBase },
        { name: communityTitle, url: `${cleanBase}/created/${community}` }
      ])
    : null;

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {breadcrumbJsonLd && <JsonLd data={breadcrumbJsonLd} />}
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
