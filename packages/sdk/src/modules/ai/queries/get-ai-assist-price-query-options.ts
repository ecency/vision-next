import { queryOptions } from "@tanstack/react-query";
import { CONFIG, getBoundFetch, QueryKeys } from "../../core";
import type { AiAssistPrice } from "../types";

export function getAiAssistPriceQueryOptions(username: string | undefined, accessToken: string) {
  return queryOptions({
    queryKey: QueryKeys.ai.assistPrices(username),
    queryFn: async () => {
      const fetchApi = getBoundFetch();
      const response = await fetchApi(CONFIG.privateApiHost + "/private-api/ai-assist-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: accessToken }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch AI assist prices: ${response.status}`);
      }

      return (await response.json()) as AiAssistPrice[];
    },
    staleTime: 60_000,
    enabled: !!accessToken,
  });
}
