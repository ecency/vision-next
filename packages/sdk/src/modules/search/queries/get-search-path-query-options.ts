import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";

export function getSearchPathQueryOptions(q: string) {
  return queryOptions({
    queryKey: ["search", "path", q],
    queryFn: async () => {
      const response = await fetch(CONFIG.privateApiHost + "/search-api/search-path", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q }),
      });

      if (!response.ok) {
        throw new Error(`Search path failed: ${response.status}`);
      }

      const data = await response.json();

      if (data?.length > 0) {
        return data as string[];
      }

      return [q];
    },
  });
}
