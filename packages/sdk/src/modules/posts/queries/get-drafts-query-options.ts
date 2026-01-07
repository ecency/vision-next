import { queryOptions } from "@tanstack/react-query";
import { CONFIG, getBoundFetch } from "@/modules/core";
import { Draft } from "../types/draft";

export function getDraftsQueryOptions(activeUsername: string | undefined, code?: string) {
  return queryOptions({
    queryKey: ["posts", "drafts", activeUsername],
    queryFn: async () => {
      if (!activeUsername || !code) {
        return [];
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(CONFIG.privateApiHost + "/private-api/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch drafts: ${response.status}`);
      }

      return response.json() as Promise<Draft[]>;
    },
    enabled: !!activeUsername && !!code,
  });
}
