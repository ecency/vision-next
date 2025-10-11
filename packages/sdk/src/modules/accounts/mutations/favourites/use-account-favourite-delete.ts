import {
  CONFIG,
  getAccessToken,
  getBoundFetch,
  getQueryClient,
} from "@/modules/core";
import { useMutation } from "@tanstack/react-query";

export function useAccountFavouriteDelete(
  username: string | undefined,
  onSuccess: () => void,
  onError: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["accounts", "favourites", "add", username],
    mutationFn: async (account: string) => {
      if (!username) {
        throw new Error("[SDK][Account][Bookmarks] – no active user");
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/favorites-delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account,
            code: getAccessToken(username),
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
