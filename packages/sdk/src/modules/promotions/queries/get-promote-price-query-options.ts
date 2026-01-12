import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "../../core";
import type { PromotePrice } from "../types";

export function getPromotePriceQueryOptions(accessToken: string) {
  return queryOptions({
    queryKey: ["promotions", "promote-price"],
    queryFn: async () => {
      const response = await fetch(CONFIG.privateApiHost + "/private-api/promote-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: accessToken }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch promote prices: ${response.status}`);
      }

      return await response.json() as PromotePrice[];
    },
    enabled: !!accessToken
  });
}
