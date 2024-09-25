import { getCommunityCache } from "@/core/caches";
import { notFound, redirect } from "next/navigation";
import { prefetchGetPostsFeedQuery } from "@/api/queries";
import { EntryListContent, LinearProgress } from "@/features/shared";
import { CommunityContentSearch } from "@/app/(dynamicPages)/community/[tag]/[community]/_components/community-content-search";
import { ProfileEntriesLayout } from "@/app/(dynamicPages)/profile/[username]/_components/profile-entries-layout";
import { Entry } from "@/entities";
import { CommunityContentInfiniteList } from "@/app/(dynamicPages)/community/[tag]/[community]/_components/community-content-infinite-list";

interface Props {
  params: { tag: string; community: string };
}

export default async function CommunityPostsPage({ params: { community, tag } }: Props) {
  const communityData = await getCommunityCache(community).prefetch();
  if (!communityData) {
    return notFound();
  }

  const data = await prefetchGetPostsFeedQuery(tag, community);
  if (!data || !data.pages || data.pages.length === 0) {
    return <></>;
  }

  return (
    <>
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
          username={community}
          isPromoted={false}
          entries={data.pages.reduce<Entry[]>((acc, page) => [...acc, ...(page as Entry[])], [])}
          loading={false}
          sectionParam={tag}
        />
        <CommunityContentInfiniteList community={communityData} section={tag} />
      </ProfileEntriesLayout>
      {/*)}*/}
    </>
  );
}
