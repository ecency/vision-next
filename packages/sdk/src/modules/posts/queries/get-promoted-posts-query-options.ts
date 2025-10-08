import { CONFIG } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";

// TODO: replace any with Entry
export function getPromotedPostsQuery<T extends any>(
  type: "feed" | "waves" = "feed"
) {
  return queryOptions({
    queryKey: ["posts", "promoted", type],
    queryFn: async () => {
      const url = new URL(
        CONFIG.privateApiHost + "/private-api/promoted-entries"
      );
      if (type === "waves") {
        url.searchParams.append("short_content", "1");
      }

      const response = await fetch(url.toString(), {
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
