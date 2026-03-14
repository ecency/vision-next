import { queryOptions } from "@tanstack/react-query";
import { CONFIG, QueryKeys } from "@/modules/core";
import { TrendingTag } from "@/modules/posts/types";

export function getSearchTopicsQueryOptions(q: string, limit = 10) {
  return queryOptions({
    queryKey: QueryKeys.search.topics(q, limit),
    queryFn: async (): Promise<string[]> => {
      const tags = (await CONFIG.hiveClient.database.call("get_trending_tags", [
        q,
        limit + 1,
      ])) as TrendingTag[];

      return tags
        .map((t) => t.name)
        .filter((name) => name !== "" && !name.startsWith("hive-"));
    },
    enabled: !!q,
  });
}
