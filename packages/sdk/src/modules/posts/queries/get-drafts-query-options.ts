import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { CONFIG, getBoundFetch } from "@/modules/core";
import { Draft, DraftsWrappedResponse } from "../types/draft";

export function getDraftsQueryOptions(activeUsername: string | undefined, code?: string) {
  return queryOptions({
    queryKey: ["posts", "drafts", activeUsername],
    queryFn: async () => {
      if (!activeUsername || !code) {
        return [];
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(CONFIG.privateApiHost + "/private-api/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch drafts: ${response.status}`);
      }

      return response.json() as Promise<Draft[]>;
    },
    enabled: !!activeUsername && !!code,
  });
}

export function getDraftsInfiniteQueryOptions(
  activeUsername: string | undefined,
  code?: string,
  limit: number = 10
) {
  return infiniteQueryOptions({
    queryKey: ["posts", "drafts", "infinite", activeUsername, limit],
    queryFn: async ({ pageParam = 0 }) => {
      if (!activeUsername || !code) {
        return {
          data: [],
          pagination: {
            total: 0,
            limit,
            offset: 0,
            has_next: false,
          },
        };
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        `${CONFIG.privateApiHost}/private-api/drafts?format=wrapped&offset=${pageParam}&limit=${limit}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch drafts: ${response.status}`);
      }

      return response.json() as Promise<DraftsWrappedResponse>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.has_next) {
        return lastPage.pagination.offset + lastPage.pagination.limit;
      }
      return undefined;
    },
    enabled: !!activeUsername && !!code,
  });
}
