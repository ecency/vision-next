import { CONFIG, getBoundFetch, normalizeToWrappedResponse, QueryKeys } from "@/modules/core";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { AccountFavorite } from "../types";

export function getFavouritesQueryOptions(
  activeUsername: string | undefined,
  code: string | undefined
) {
  return queryOptions({
    queryKey: QueryKeys.accounts.favourites(activeUsername),
    enabled: !!activeUsername && !!code,
    queryFn: async () => {
      if (!activeUsername || !code) {
        throw new Error("[SDK][Accounts][Favourites] – missing auth");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/favorites",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        }
      );
      return (await response.json()) as AccountFavorite[];
    },
  });
}

export function getFavouritesInfiniteQueryOptions(
  activeUsername: string | undefined,
  code: string | undefined,
  limit: number = 10
) {
  return infiniteQueryOptions({
    queryKey: QueryKeys.accounts.favouritesInfinite(activeUsername, limit),
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
        `${CONFIG.privateApiHost}/private-api/favorites?format=wrapped&offset=${pageParam}&limit=${limit}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch favorites: ${response.status}`);
      }

      const json = await response.json();
      return normalizeToWrappedResponse<AccountFavorite>(json, limit);
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
