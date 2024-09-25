import { ProfileEntriesList } from "./_components";
import { getAccountFullQuery, prefetchGetPostsFeedQuery } from "@/api/queries";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";

interface Props {
  params: { username: string };
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  return generateProfileMetadata(props.params.username);
}

export default async function Page({ params: { username } }: Props) {
  const account = await getAccountFullQuery(username).prefetch();
  await prefetchGetPostsFeedQuery("posts", `@${username}`);
  await EcencyEntriesCacheManagement.getEntryQueryByPath(
    username,
    account?.profile.pinned
  ).prefetch();

  // let searchData: SearchResult[] | undefined = undefined;
  // if (searchParam && searchParam !== "") {
  //   const searchPages = await getSearchApiQuery(
  //     `${searchParam} author:${username} type:post`,
  //     "newest",
  //     false
  //   ).prefetch();
  //   searchData = searchPages!!.pages[0].results.sort(
  //     (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
  //   );
  // }

  if (!account) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ProfileEntriesList section="posts" account={account} />
    </HydrationBoundary>
  );
}
