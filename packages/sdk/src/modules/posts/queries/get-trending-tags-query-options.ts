import { QueryKeys } from "@/modules/core";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { TrendingTag } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

export function getTrendingTagsQueryOptions(limit = 20) {
  return infiniteQueryOptions({
    queryKey: QueryKeys.posts.trendingTags(),
    queryFn: async ({ pageParam: { afterTag } }) =>
      callRPC("condenser_api.get_trending_tags", [afterTag, limit])
        .then((tags: TrendingTag[]) =>
          tags
            .filter((x) => x.name !== "")
            .filter((x) => !x.name.startsWith("hive-"))
            .map((x) => x.name)
        ),
    initialPageParam: { afterTag: "" },
    getNextPageParam: (lastPage) =>
      lastPage?.length > 0
        ? { afterTag: lastPage[lastPage.length - 1] }
        : undefined,
    staleTime: 60 * 60 * 1000, // 1 hour — tags change slowly
  });
}
