import { queryOptions } from "@tanstack/react-query";
import { CONFIG, QueryKeys } from "@/modules/core";
import { TrendingTag } from "@/modules/posts/types";

export function getSearchTopicsQueryOptions(q: string, limit = 10) {
  const normalized = q.trim();

  return queryOptions({
    queryKey: QueryKeys.search.topics(normalized, limit),
    queryFn: async (): Promise<string[]> => {
      const tags = (await CONFIG.hiveClient.database.call("get_trending_tags", [
        normalized,
        limit + 1,
      ])) as TrendingTag[];

      return tags
        .map((t) => t.name)
        .filter((name) => name !== "" && !name.startsWith("hive-"))
        .slice(0, limit);
    },
    enabled: !!normalized,
  });
}
