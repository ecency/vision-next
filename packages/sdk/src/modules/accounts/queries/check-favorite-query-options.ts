import { CONFIG, getBoundFetch, QueryKeys } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";

/**
 * Query options to check if a specific account is in the active user's favorites
 * @param activeUsername - The logged-in user's username
 * @param code - Access token for authentication
 * @param targetUsername - The username to check if favorited
 * @returns Query options for checking if target is favorited
 */
export function checkFavoriteQueryOptions(
  activeUsername: string | undefined,
  code: string | undefined,
  targetUsername: string | undefined
) {
  return queryOptions({
    queryKey: QueryKeys.accounts.checkFavorite(activeUsername!, targetUsername!),
    enabled: !!activeUsername && !!code && !!targetUsername,
    queryFn: async () => {
      if (!activeUsername || !code) {
        throw new Error("[SDK][Accounts][Favorites] – missing auth");
      }
      if (!targetUsername) {
        throw new Error("[SDK][Accounts][Favorites] – no target username");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/favorites-check",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            account: targetUsername,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `[SDK][Accounts][Favorites] – favorites-check failed with status ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      if (typeof result !== "boolean") {
        throw new Error(
          `[SDK][Accounts][Favorites] – favorites-check returned invalid type: expected boolean, got ${typeof result}`
        );
      }

      return result;
    },
  });
}
