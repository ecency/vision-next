import { CONFIG } from "@/modules/core";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { TrendingTag } from "../types";

export function getTrendingTagsWithStatsQueryOptions(limit = 250) {
  return infiniteQueryOptions({
    queryKey: ["posts", "trending-tags", "stats", limit],
    queryFn: async ({ pageParam: { afterTag } }) =>
      CONFIG.hiveClient.database
        .call("get_trending_tags", [afterTag, limit])
        .then((tags: TrendingTag[]) =>
          tags.filter((tag) => tag.name !== "").filter((tag) => !tag.name.startsWith("hive-"))
        ),
    initialPageParam: { afterTag: "" },
    getNextPageParam: (lastPage) =>
      lastPage?.length ? { afterTag: lastPage[lastPage.length - 1].name } : undefined,
    staleTime: Infinity,
    refetchOnMount: true
  });
}
