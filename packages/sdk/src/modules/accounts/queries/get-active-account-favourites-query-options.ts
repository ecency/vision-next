import { CONFIG, getBoundFetch } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { AccountFavorite } from "../types";

export function getActiveAccountFavouritesQueryOptions(
  activeUsername: string | undefined,
  code: string | undefined
) {
  return queryOptions({
    queryKey: ["accounts", "favourites", activeUsername],
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
