import { ProfileEntriesList, ProfileSearchContent } from "../_components";
import { prefetchGetPostsFeedQuery } from "@/api/queries";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, prefetchQuery, fetchInfiniteQuery } from "@/core/react-query";
import { getAccountFullQueryOptions, getSearchApiInfiniteQueryOptions } from "@ecency/sdk";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";
import { Entry, SearchResult } from "@/entities";
import type { InfiniteData } from "@tanstack/react-query";
import type { SearchResponse } from "@/entities";

interface Props {
  params: Promise<{ username: string; section: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username, section } = await props.params;
  return generateProfileMetadata(username.replace("%40", ""), section);
}

export default async function Page({ params, searchParams }: Props) {
  const { username: usernameParam, section } = await params;
  const { query: searchParam } = await searchParams;

  const username = usernameParam.replace("%40", "");
  const [account, searchPages, prefetchedFeed] = await Promise.all([
    prefetchQuery(getAccountFullQueryOptions(username)),
    searchParam && searchParam !== ""
      ? fetchInfiniteQuery(
          getSearchApiInfiniteQueryOptions(
            `${searchParam} author:${username} type:post`,
            "newest",
            false
          )
        )
      : Promise.resolve(undefined),
    searchParam && searchParam !== ""
      ? Promise.resolve(undefined)
      : prefetchGetPostsFeedQuery(section, `@${username}`)
  ]);

  if (account?.profile.pinned) {
    await prefetchQuery(EcencyEntriesCacheManagement.getEntryQueryByPath(
      username,
      account.profile.pinned
    ));
  }

  const firstPage = searchPages?.pages?.[0] as SearchResponse | undefined;
  const results: SearchResult[] = firstPage?.results ?? [];

  const searchData = results.length > 0
    ? results
        .slice()
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    : undefined;
  const initialFeed = prefetchedFeed as InfiniteData<Entry[], unknown> | undefined;

  if (!account || !["", "posts", "comments", "replies", "blog"].includes(section)) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {searchData && searchData.length > 0 ? (
        <ProfileSearchContent items={searchData} />
      ) : (
        <ProfileEntriesList section={section} account={account} initialFeed={initialFeed} />
      )}
    </HydrationBoundary>
  );
}
