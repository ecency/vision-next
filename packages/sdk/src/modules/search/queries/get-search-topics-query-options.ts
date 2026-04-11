import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { TrendingTag } from "@/modules/posts/types";
import { callRPC } from "@/modules/core/hive-tx";

export function getSearchTopicsQueryOptions(q: string, limit = 10) {
  const normalized = q.trim();

  return queryOptions({
    queryKey: QueryKeys.search.topics(normalized, limit),
    queryFn: async (): Promise<string[]> => {
      const tags = (await callRPC("condenser_api.get_trending_tags", [
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
