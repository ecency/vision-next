import { ConfigManager, getBoundFetch, QueryKeys } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";

// TODO: replace any with Entry
export function getPromotedPostsQuery<T extends any>(
  type: "feed" | "waves" = "feed"
) {
  return queryOptions({
    queryKey: QueryKeys.posts.promoted(type),
    queryFn: async () => {
      const baseUrl = ConfigManager.getValidatedBaseUrl();
      const url = new URL("/private-api/promoted-entries", baseUrl);
      if (type === "waves") {
        url.searchParams.append("short_content", "1");
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data as T[];
    },
  });
}
