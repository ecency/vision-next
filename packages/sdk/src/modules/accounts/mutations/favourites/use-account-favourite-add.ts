import { CONFIG, getBoundFetch, getQueryClient } from "@/modules/core";
import { useMutation } from "@tanstack/react-query";

export function useAccountFavouriteAdd(
  username: string | undefined,
  code: string | undefined,
  onSuccess: () => void,
  onError: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["accounts", "favourites", "add", username],
    mutationFn: async (account: string) => {
      if (!username || !code) {
        throw new Error("[SDK][Account][Bookmarks] – missing auth");
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
      getQueryClient().invalidateQueries({
        queryKey: ["accounts", "favourites", username],
      });
    },
    onError,
  });
}
