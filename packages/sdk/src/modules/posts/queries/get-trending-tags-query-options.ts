import { CONFIG } from "@/modules/core";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { TrendingTag } from "../types";

export function getTrendingTagsQueryOptions(limit = 20) {
  return infiniteQueryOptions({
    queryKey: ["posts", "trending-tags"],
    queryFn: async ({ pageParam: { afterTag } }) =>
      CONFIG.hiveClient.database
        .call("get_trending_tags", [afterTag, limit])
        .then((tags: TrendingTag[]) =>
          tags
            .filter((x) => x.name !== "")
            .filter((x) => !x.name.startsWith("hive-"))
            .map((x) => x.name)
        ),
    initialPageParam: { afterTag: "" },
    getNextPageParam: (lastPage) => ({
      afterTag: lastPage?.[lastPage?.length - 1],
    }),
    staleTime: Infinity,
    refetchOnMount: true,
  });
}
