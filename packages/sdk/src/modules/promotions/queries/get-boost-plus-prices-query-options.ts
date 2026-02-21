import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "../../core";
import type { PromotePrice } from "../types";

export function getBoostPlusPricesQueryOptions(accessToken: string) {
  return queryOptions({
    queryKey: ["promotions", "boost-plus-prices"],
    queryFn: async () => {
      if (!accessToken) {
        return [];
      }

      const response = await fetch(CONFIG.privateApiHost + "/private-api/boost-plus-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: accessToken }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch boost plus prices: ${response.status}`);
      }

      return await response.json() as PromotePrice[];
    },
    staleTime: Infinity,
    enabled: !!accessToken
  });
}
