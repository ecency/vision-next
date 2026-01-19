import { CONFIG, getBoundFetch, WrappedResponse } from "@/modules/core";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { Fragment } from "../types";

export function getFragmentsQueryOptions(username: string, code?: string) {
  return queryOptions({
    queryKey: ["posts", "fragments", username],
    queryFn: async () => {
      if (!code) {
        return [];
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/fragments",
        {
          method: "POST",
          body: JSON.stringify({
            code,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.json() as Promise<Fragment[]>;
    },
    enabled: !!username && !!code,
  });
}

export function getFragmentsInfiniteQueryOptions(
  username: string | undefined,
  code?: string,
  limit: number = 10
) {
  return infiniteQueryOptions({
    queryKey: ["posts", "fragments", "infinite", username, limit],
    queryFn: async ({ pageParam = 0 }) => {
      if (!username || !code) {
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
        `${CONFIG.privateApiHost}/private-api/fragments?format=wrapped&offset=${pageParam}&limit=${limit}`,
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
        throw new Error(`Failed to fetch fragments: ${response.status}`);
      }

      return response.json() as Promise<WrappedResponse<Fragment>>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.has_next) {
        return lastPage.pagination.offset + lastPage.pagination.limit;
      }
      return undefined;
    },
    enabled: !!username && !!code,
  });
}
