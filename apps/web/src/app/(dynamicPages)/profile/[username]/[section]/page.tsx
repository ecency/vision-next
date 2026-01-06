import { ProfileEntriesList, ProfileSearchContent } from "../_components";
import { prefetchGetPostsFeedQuery } from "@/api/queries";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, prefetchQuery } from "@/core/react-query";
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
  const account = await prefetchQuery(getAccountFullQueryOptions(username));
  await EcencyEntriesCacheManagement.getEntryQueryByPath(
    username,
    account?.profile.pinned
  ).prefetch();

  let searchData: SearchResult[] | undefined = undefined;
  let initialFeed: InfiniteData<Entry[], unknown> | undefined;

  if (searchParam && searchParam !== "") {
    const searchPages = await getQueryClient().fetchInfiniteQuery(
      getSearchApiInfiniteQueryOptions(
        `${searchParam} author:${username} type:post`,
        "newest",
        false
      )
    );

    const firstPage: SearchResponse | undefined = searchPages?.pages?.[0];
    const results: SearchResult[] =
        (firstPage as any)?.results ??
        (firstPage as any)?.items ??
        [];

    searchData = results
        .slice()
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  } else {
    const prefetched = await prefetchGetPostsFeedQuery(section, `@${username}`);
    initialFeed = prefetched as InfiniteData<Entry[], unknown> | undefined;
  }

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
