import { ProfileEntriesList, ProfileSearchContent } from "./_components";
import { prefetchGetPostsFeedQuery } from "@/api/queries";
import { prefetchQuery, getQueryClient, fetchInfiniteQuery } from "@/core/react-query";
import { getAccountFullQueryOptions, getSearchApiInfiniteQueryOptions } from "@ecency/sdk";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";
import { Entry, SearchResult } from "@/entities";
import type { SearchResponse } from "@ecency/sdk";
import type { InfiniteData } from "@tanstack/react-query";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

// ISR: profile metadata is stable. Live data (balances, votes) fetched client-side.
// 5 min revalidation aligned with edge cache TTL.
export const revalidate = 300;

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace("%40", ""));
}

export default async function Page({ params, searchParams }: Props) {
  const { username: usernameParam } = await params;
  const username = usernameParam.replace("%40", "");
  const { query: searchParam } = await searchParams;

  const [account, searchPages, prefetchedFeed] = await Promise.all([
    prefetchQuery(getAccountFullQueryOptions(username)),
    searchParam
      ? fetchInfiniteQuery(
          getSearchApiInfiniteQueryOptions(
            `${searchParam} author:${username} type:post`,
            "newest",
            false
          )
        )
      : Promise.resolve(undefined),
    searchParam
      ? Promise.resolve(undefined)
      : prefetchGetPostsFeedQuery("posts", `@${username}`)
  ]);

  if (account?.profile.pinned) {
    await prefetchQuery(EcencyEntriesCacheManagement.getEntryQueryByPath(
      username,
      account.profile.pinned
    ));
  }

  const firstPage = searchPages?.pages?.[0] as SearchResponse | undefined;
  // SDK SearchResult is a subset of the app's SearchResult; the API returns the full shape
  const results = (firstPage?.results ?? []) as unknown as SearchResult[];
  const searchData = results.length > 0
    ? results
        .slice()
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    : undefined;
  const initialFeed = prefetchedFeed as InfiniteData<Entry[], unknown> | undefined;

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
