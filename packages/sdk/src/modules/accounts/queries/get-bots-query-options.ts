import { queryOptions } from "@tanstack/react-query";
import { CONFIG, QueryKeys } from "@/modules/core";

export function getBotsQueryOptions() {
  return queryOptions({
    queryKey: QueryKeys.accounts.bots(),
    queryFn: async () => {
      const response = await fetch(CONFIG.privateApiHost + "/private-api/public/bots", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bots: ${response.status}`);
      }

      return response.json() as Promise<string[]>;
    },
    refetchOnMount: true,
    staleTime: Infinity,
  });
}
