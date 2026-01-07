import { CONFIG, getBoundFetch } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { AccountBookmark } from "../types";

export function getActiveAccountBookmarksQueryOptions(
  activeUsername: string | undefined,
  code: string | undefined
) {
  return queryOptions({
    queryKey: ["accounts", "bookmarks", activeUsername],
    enabled: !!activeUsername && !!code,
    queryFn: async () => {
      if (!activeUsername || !code) {
        throw new Error("[SDK][Accounts][Bookmarks] – missing auth");
      }
      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/bookmarks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        }
      );
      return (await response.json()) as AccountBookmark[];
    },
  });
}
