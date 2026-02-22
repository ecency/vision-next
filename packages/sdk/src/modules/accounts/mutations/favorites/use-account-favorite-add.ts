import { CONFIG, getBoundFetch, getQueryClient, QueryKeys } from "@/modules/core";
import { useMutation } from "@tanstack/react-query";

export function useAccountFavoriteAdd(
  username: string | undefined,
  code: string | undefined,
  onSuccess: () => void,
  onError: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["accounts", "favorites", "add", username],
    mutationFn: async (account: string) => {
      if (!username || !code) {
        throw new Error("[SDK][Account][Favorites] – missing auth");
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/favorites-add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account,
            code,
          }),
        }
      );
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      const qc = getQueryClient();
      qc.invalidateQueries({ queryKey: QueryKeys.accounts.favorites(username) });
      qc.invalidateQueries({ queryKey: QueryKeys.accounts.favoritesInfinite(username) });
    },
    onError,
  });
}
