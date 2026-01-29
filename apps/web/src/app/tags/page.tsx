import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, prefetchInfiniteQuery } from "@/core/react-query";
import { getTrendingTagsWithStatsQueryOptions } from "@ecency/sdk";
import { TagsPage } from "@/app/tags/_page";
import { Metadata } from "next";

export const revalidate = 180; // 3 minutes

export const metadata: Metadata = {
  title: "Tags"
};

export default async function Page() {
  await prefetchInfiniteQuery(getTrendingTagsWithStatsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <TagsPage />
    </HydrationBoundary>
  );
}
