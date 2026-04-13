import { queryOptions } from "@tanstack/react-query";
import { CONFIG, getBoundFetch, QueryKeys } from "../../core";
import type { AiImagePriceResponse } from "../types";

export function getAiGeneratePriceQueryOptions(accessToken: string) {
  return queryOptions({
    queryKey: QueryKeys.ai.prices(),
    queryFn: async () => {
      const fetchApi = getBoundFetch();
      const response = await fetchApi(CONFIG.privateApiHost + "/private-api/ai-generate-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: accessToken }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch AI generation prices: ${response.status}`);
      }

      return (await response.json()) as AiImagePriceResponse;
    },
    staleTime: 300_000,
    enabled: !!accessToken,
  });
}
