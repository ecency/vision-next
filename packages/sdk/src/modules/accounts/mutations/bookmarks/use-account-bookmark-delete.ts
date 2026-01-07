import { CONFIG, getBoundFetch, getQueryClient } from "@/modules/core";
import { useMutation } from "@tanstack/react-query";

export function useBookmarkDelete(
  username: string | undefined,
  code: string | undefined,
  onSuccess: () => void,
  onError: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["accounts", "bookmarks", "delete", username],
    mutationFn: async (bookmarkId: string) => {
      if (!username || !code) {
        throw new Error("[SDK][Account][Bookmarks] – missing auth");
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/bookmarks-delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: bookmarkId,
            code,
          }),
        }
      );
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      getQueryClient().invalidateQueries({
        queryKey: ["accounts", "bookmarks", username],
      });
    },
    onError,
  });
}
