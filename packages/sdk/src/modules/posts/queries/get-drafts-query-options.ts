import { queryOptions } from "@tanstack/react-query";
import { CONFIG, getAccessToken } from "@/modules/core";
import { Draft } from "../types/draft";

export function getDraftsQueryOptions(activeUsername: string | undefined) {
  return queryOptions({
    queryKey: ["posts", "drafts", activeUsername],
    queryFn: async () => {
      if (!activeUsername) {
        return [];
      }

      const response = await fetch(CONFIG.privateApiHost + "/private-api/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: getAccessToken(activeUsername),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch drafts: ${response.status}`);
      }

      return response.json() as Promise<Draft[]>;
    },
    enabled: !!activeUsername,
  });
}
