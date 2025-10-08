import { CONFIG, getAccessToken, getQueryClient } from "@/modules/core";
import { useMutation } from "@tanstack/react-query";

export function useBookmarkDelete(
  username: string | undefined,
  onSuccess: () => void,
  onError: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["accounts", "bookmarks", "delete", username],
    mutationFn: async (bookmarkId: string) => {
      if (!username) {
        throw new Error("[SDK][Account][Bookmarks] – no active user");
      }

      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/bookmarks-delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: bookmarkId,
            code: getAccessToken(username),
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
