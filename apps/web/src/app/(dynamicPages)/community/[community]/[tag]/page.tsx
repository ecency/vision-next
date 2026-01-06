import { getCommunityCache } from "@/core/caches";
import { notFound } from "next/navigation";
import { prefetchGetPostsFeedQuery } from "@/api/queries";
import { EntryListContent, LinearProgress } from "@/features/shared";
import { dehydrate, HydrationBoundary, InfiniteData } from "@tanstack/react-query";
import { getQueryClient, prefetchQuery } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateCommunityMetadata } from "@/app/(dynamicPages)/community/[community]/_helpers";
import { CommunityContentSearch } from "../_components/community-content-search";
import { ProfileEntriesLayout } from "@/app/(dynamicPages)/profile/[username]/_components/profile-entries-layout";
import { CommunityContentInfiniteList } from "../_components/community-content-infinite-list";
import { Entry, SearchResponse } from "@/entities";

type Page = Entry[] | SearchResponse;

interface Props {
  params: Promise<{ tag: string; community: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { community, tag } = await props.params;
  return generateCommunityMetadata(community, tag);
}

function pageToEntries(p: Page): Entry[] {
  if (Array.isArray(p)) return p;
  // Adjust these fallbacks to match your SearchResponse shape
  return (p as any).items ?? (p as any).results ?? [];
}

export default async function CommunityPostsPage({ params }: Props) {
  const { community, tag } = await params;

  const communityData = await prefetchQuery(getCommunityCache(community));
  if (!communityData) return notFound();

  // no cast needed if prefetchGetPostsFeedQuery is typed
  const data = await prefetchGetPostsFeedQuery(tag, community); // InfiniteData<Page, unknown> | undefined

  if (!data || !Array.isArray(data.pages) || data.pages.length === 0) {
    return null;
  }

  const flatEntries = data.pages.flatMap(pageToEntries);

  return (
      <HydrationBoundary state={dehydrate(getQueryClient())}>
        {data.pages.length === 0 ? <LinearProgress /> : null}

        {["hot", "created", "trending"].includes(tag) && data.pages.length > 0 && (
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
        </ProfileEntriesLayout>
      </HydrationBoundary>
  );
}
