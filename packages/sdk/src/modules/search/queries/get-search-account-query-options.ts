import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { AccountSearchResult } from "../types/account-search-result";

export function getSearchAccountQueryOptions(q: string, limit = 5, random = false) {
  return queryOptions({
    queryKey: ["search", "account", q, limit],
    queryFn: async () => {
      const data = { q, limit, random: +random };

      const response = await fetch(CONFIG.privateApiHost + "/search-api/search-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to search accounts: ${response.status}`);
      }

      return response.json() as Promise<AccountSearchResult[]>;
    },
    enabled: !!q,
  });
}
