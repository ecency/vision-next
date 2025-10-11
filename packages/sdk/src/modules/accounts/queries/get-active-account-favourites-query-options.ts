import { CONFIG, getAccessToken, getBoundFetch } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { AccountFavorite } from "../types";

export function getActiveAccountFavouritesQueryOptions(
  activeUsername: string | undefined
) {
  return queryOptions({
    queryKey: ["accounts", "favourites", activeUsername],
    enabled: !!activeUsername,
    queryFn: async () => {
      if (!activeUsername) {
        throw new Error("[SDK][Accounts][Favourites] – no active user");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/favorites",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: getAccessToken(activeUsername) }),
        }
      );
      return (await response.json()) as AccountFavorite[];
    },
  });
}
