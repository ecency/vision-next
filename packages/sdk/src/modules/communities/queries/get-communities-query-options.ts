import { CONFIG } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { Communities } from "../types";

export function getCommunitiesQueryOptions(
  sort: string,
  query?: string,
  limit = 100,
  observer: string | undefined = undefined,
  enabled = true
) {
  return queryOptions({
    queryKey: ["communities", "list", sort, query, limit],
    enabled,
    queryFn: async () => {
      const response = await CONFIG.hiveClient.call(
        "bridge",
        "list_communities",
        {
          last: "",
          limit,
          sort: sort === "hot" ? "rank" : sort,
          query: query ? query : null,
          observer,
        }
      );
      return (
        response
          ? sort === "hot"
            ? response.sort(() => Math.random() - 0.5)
            : response
          : []
      ) as Communities;
    },
  });
}
