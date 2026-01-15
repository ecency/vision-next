import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { TagSearchResult } from "../types/tag-search-result";

export function getSearchTopicsQueryOptions(q: string, limit = 20, random = false) {
  return queryOptions({
    queryKey: ["search", "topics", q],
    queryFn: async () => {
      const data = { q, limit, random: +random };

      const response = await fetch(CONFIG.privateApiHost + "/search-api/search-tag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to search topics: ${response.status}`);
      }

      return response.json() as Promise<TagSearchResult[]>;
    },
    enabled: !!q,
  });
}
