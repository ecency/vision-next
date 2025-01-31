import { getCommunityCache } from "@/core/caches";
import { notFound } from "next/navigation";
import { prefetchGetPostsFeedQuery } from "@/api/queries";
import { EntryListContent, LinearProgress } from "@/features/shared";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateCommunityMetadata } from "@/app/(dynamicPages)/community/[community]/_helpers";
import { CommunityContentSearch } from "../_components/community-content-search";
import { ProfileEntriesLayout } from "@/app/(dynamicPages)/profile/[username]/_components/profile-entries-layout";
import { CommunityContentInfiniteList } from "../_components/community-content-infinite-list";
import { Entry } from "@/entities";

interface Props {
  params: Promise<{ tag: string; community: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { community, tag } = await props.params;
  return generateCommunityMetadata(community, tag);
}

export default async function CommunityPostsPage({ params }: Props) {
  const { community, tag } = await params;
  const communityData = await getCommunityCache(community).prefetch();
  if (!communityData) {
    return notFound();
  }

  const data = await prefetchGetPostsFeedQuery(tag, community);
  if (!data || !data.pages || data.pages.length === 0) {
    return <></>;
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {data.pages.length === 0 ? <LinearProgress /> : ""}

      {["hot", "created", "trending"].includes(tag) && data.pages.length > 0 && (
        <div className="searchProfile">
          <CommunityContentSearch community={communityData} filter={tag} />
        </div>
      )}
      {/*<CommunityContentSearchData query={query} community={community} />*/}

      {/*{(!query || query?.length === 0) && (*/}
      <ProfileEntriesLayout section={tag} username={community}>
        <EntryListContent
          community={communityData}
          username={community}
          isPromoted={false}
          entries={data.pages.reduce<Entry[]>((acc, page) => [...acc, ...(page as Entry[])], [])}
          loading={false}
          sectionParam={tag}
        />
        <CommunityContentInfiniteList community={communityData} section={tag} />
      </ProfileEntriesLayout>
      {/*)}*/}
    </HydrationBoundary>
  );
}
