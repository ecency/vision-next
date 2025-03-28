import { ProfileEntriesList, ProfileSearchContent } from "./_components";
import { getAccountFullQuery, getSearchApiQuery, prefetchGetPostsFeedQuery } from "@/api/queries";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";
import { SearchResult } from "@/entities";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace("%40", ""));
}

export default async function Page({ params, searchParams }: Props) {
  const { username: usernameParam } = await params;
  const username = usernameParam.replace("%40", "");
  const { query: searchParam } = await searchParams;

  const account = await getAccountFullQuery(username).prefetch();

  await EcencyEntriesCacheManagement.getEntryQueryByPath(
    username,
    account?.profile.pinned
  ).prefetch();

  let searchData: SearchResult[] | undefined = undefined;
  if (searchParam && searchParam !== "") {
    const searchPages = await getSearchApiQuery(
      `${searchParam} author:${username} type:post`,
      "newest",
      false
    ).prefetch();
    searchData = searchPages!!.pages[0].results.sort(
      (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
    );
  } else {
    await prefetchGetPostsFeedQuery("posts", `@${username}`);
  }

  if (!account) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {searchData && searchData.length > 0 ? (
        <ProfileSearchContent items={searchData} />
      ) : (
        <ProfileEntriesList section="posts" account={account} />
      )}
    </HydrationBoundary>
  );
}
