import { getCommunityCache } from "@/core/caches";
import { notFound } from "next/navigation";
import { prefetchGetPostsFeedQuery } from "@/api/queries";
import { EntryListContent, LinearProgress } from "@/features/shared";
import { CommunityContentSearch } from "@/app/(dynamicPages)/community/[community]/_components/community-content-search";
import { ProfileEntriesLayout } from "@/app/(dynamicPages)/profile/[username]/_components/profile-entries-layout";
import { Entry } from "@/entities";
import { CommunityContentInfiniteList } from "@/app/(dynamicPages)/community/[community]/_components/community-content-infinite-list";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, prefetchQuery } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateCommunityMetadata } from "@/app/(dynamicPages)/community/[community]/_helpers";

interface Props {
  params: Promise<{ community: string }>;
}

// Enable ISR with 60 second revalidation for better performance
export const revalidate = 60;

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params;
  return generateCommunityMetadata(params.community, "created");
}

export default async function CommunityPostsPage({ params }: Props) {
  const { community } = await params;
  const communityData = await prefetchQuery(getCommunityCache(community));
  if (!communityData) {
    return notFound();
  }

  const data = await prefetchGetPostsFeedQuery("created", community);
  if (!data || !data.pages || data.pages.length === 0) {
    return <></>;
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {data.pages.length === 0 ? <LinearProgress /> : ""}

      {["hot", "created", "trending"].includes("created") && data.pages.length > 0 && (
        <div className="searchProfile">
          <CommunityContentSearch community={communityData} filter="created" />
        </div>
      )}

      <ProfileEntriesLayout section="created" username={community}>
        <EntryListContent
          username={community}
          isPromoted={false}
          entries={data.pages.reduce<Entry[]>((acc, page) => [...acc, ...(page as Entry[])], [])}
          loading={false}
          sectionParam="created"
        />
        <CommunityContentInfiniteList community={communityData} section="created" />
      </ProfileEntriesLayout>
    </HydrationBoundary>
  );
}
