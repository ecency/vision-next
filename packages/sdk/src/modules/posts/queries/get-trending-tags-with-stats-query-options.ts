import { CONFIG, QueryKeys } from "@/modules/core";
import { isCommunity } from "@/modules/core/utils";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { TrendingTag } from "../types";

export function getTrendingTagsWithStatsQueryOptions(limit = 250) {
  return infiniteQueryOptions({
    queryKey: QueryKeys.posts.trendingTagsWithStats(limit),
    queryFn: async ({ pageParam: { afterTag } }) =>
      CONFIG.hiveClient.database
        .call("get_trending_tags", [afterTag, limit])
        .then((tags: TrendingTag[]) =>
          tags.filter((tag) => tag.name !== "").filter((tag) => !isCommunity(tag.name))
        ),
    initialPageParam: { afterTag: "" },
    getNextPageParam: (lastPage) =>
      lastPage?.length ? { afterTag: lastPage[lastPage.length - 1].name } : undefined,
    staleTime: Infinity
  });
}
