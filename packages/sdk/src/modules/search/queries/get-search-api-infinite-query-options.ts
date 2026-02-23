import { infiniteQueryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { SearchResponse } from "../types/search-response";

export function getSearchApiInfiniteQueryOptions(
  q: string,
  sort: string,
  hideLow: boolean,
  since?: string,
  votes?: number
) {
  return infiniteQueryOptions({
    queryKey: ["search", "api", q, sort, hideLow, since, votes],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      interface SearchApiPayload {
        q: string;
        sort: string;
        hide_low: boolean;
        since?: string;
        scroll_id?: string;
        votes?: number;
      }

      const payload: SearchApiPayload = { q, sort, hide_low: hideLow };

      if (since) {
        payload.since = since;
      }
      if (pageParam) {
        payload.scroll_id = pageParam;
      }
      if (votes !== undefined) {
        payload.votes = votes;
      }

      const response = await fetch(CONFIG.privateApiHost + "/search-api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      return response.json() as Promise<SearchResponse>;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: SearchResponse) => lastPage?.scroll_id,
    enabled: !!q,
  });
}
