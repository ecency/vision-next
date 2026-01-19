import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { CONFIG, getBoundFetch, WrappedResponse } from "@/modules/core";
import { Schedule } from "../types/schedule";

export function getSchedulesQueryOptions(activeUsername: string | undefined, code?: string) {
  return queryOptions({
    queryKey: ["posts", "schedules", activeUsername],
    queryFn: async () => {
      if (!activeUsername || !code) {
        return [];
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(CONFIG.privateApiHost + "/private-api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.status}`);
      }

      return response.json() as Promise<Schedule[]>;
    },
    enabled: !!activeUsername && !!code,
  });
}

export function getSchedulesInfiniteQueryOptions(
  activeUsername: string | undefined,
  code?: string,
  limit: number = 10
) {
  return infiniteQueryOptions({
    queryKey: ["posts", "schedules", "infinite", activeUsername, limit],
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
        `${CONFIG.privateApiHost}/private-api/schedules?format=wrapped&offset=${pageParam}&limit=${limit}`,
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
        throw new Error(`Failed to fetch schedules: ${response.status}`);
      }

      return response.json() as Promise<WrappedResponse<Schedule>>;
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
