import {
  CONFIG,
  getAccessToken,
  getBoundFetch,
  getQueryClient,
} from "@/modules/core";
import { useMutation } from "@tanstack/react-query";

interface Payload {
  author: string;
  permlink: string;
}

export function useBookmarkAdd(
  username: string | undefined,
  onSuccess: () => void,
  onError: (e: Error) => void
) {
  return useMutation({
    mutationKey: ["accounts", "bookmarks", "add", username],
    mutationFn: async ({ author, permlink }: Payload) => {
      if (!username) {
        throw new Error("[SDK][Account][Bookmarks] – no active user");
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/bookmarks-add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            author,
            permlink,
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
