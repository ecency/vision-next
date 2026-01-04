import { ProfileEntriesList, ProfileSearchContent } from "./_components";
import { getSearchApiQuery, prefetchGetPostsFeedQuery } from "@/api/queries";
import { prefetchQuery, getQueryClient } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";
import { Entry, SearchResult } from "@/entities";
import type { InfiniteData } from "@tanstack/react-query";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

// Enable ISR with 60 second revalidation for better profile page performance
export const revalidate = 60;

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace("%40", ""));
}

export default async function Page({ params, searchParams }: Props) {
  const { username: usernameParam } = await params;
  const username = usernameParam.replace("%40", "");
  const { query: searchParam } = await searchParams;

  const account = await prefetchQuery(getAccountFullQueryOptions(username));

  await EcencyEntriesCacheManagement.getEntryQueryByPath(
    username,
    account?.profile.pinned
  ).prefetch();

  let searchData: SearchResult[] | undefined = undefined;
  let initialFeed: InfiniteData<Entry[], unknown> | undefined;

  if (searchParam && searchParam !== "") {
    const searchPages = await getSearchApiQuery(
      `${searchParam} author:${username} type:post`,
      "newest",
      false
    ).prefetch();
    if (searchPages?.pages?.[0]?.results) {
      searchData = searchPages.pages[0].results.sort(
        (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
      );
    }
  } else {
    const prefetched = await prefetchGetPostsFeedQuery("posts", `@${username}`);
    initialFeed = prefetched as InfiniteData<Entry[], unknown> | undefined;
  }

  if (!account) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {searchData && searchData.length > 0 ? (
        <ProfileSearchContent items={searchData} />
      ) : (
        <ProfileEntriesList section="posts" account={account} initialFeed={initialFeed} />
      )}
    </HydrationBoundary>
  );
}
