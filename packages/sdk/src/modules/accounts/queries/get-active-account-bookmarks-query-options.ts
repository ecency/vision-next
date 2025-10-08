import { CONFIG, getAccessToken } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { AccountBookmark } from "../types";

export function getActiveAccountBookmarksQueryOptions(
  activeUsername: string | undefined
) {
  return queryOptions({
    queryKey: ["accounts", "bookmarks", activeUsername],
    enabled: !!activeUsername,
    queryFn: async () => {
      if (!activeUsername) {
        throw new Error("[SDK][Accounts][Bookmarks] – no active user");
      }
      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/bookmarks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: getAccessToken(activeUsername) }),
        }
      );
      return (await response.json()) as AccountBookmark[];
    },
  });
}
