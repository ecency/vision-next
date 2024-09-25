import { ProfileEntriesList } from "@/app/[...slugs]/_profile-components";
import { getAccountFullQuery, prefetchGetPostsFeedQuery } from "@/api/queries";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";

interface Props {
  params: { username: string; section: string };
}

export default async function Page({ params: { username, section } }: Props) {
  const account = await getAccountFullQuery(username).prefetch();
  await prefetchGetPostsFeedQuery(section, `@${username}`);
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

  if (!account || !["", "posts", "comments", "replies", "blog"].includes(section)) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ProfileEntriesList section={section} account={account} />
    </HydrationBoundary>
  );
}
