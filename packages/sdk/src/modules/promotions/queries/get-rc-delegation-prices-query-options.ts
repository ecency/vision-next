import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "../../core";
import type { PromotePrice } from "../types";

/**
 * RC top-up pricing: duration -> Points cost tiers, served by the ePoints
 * backend via the private API. Reuses the {@link PromotePrice} shape
 * ({ duration, price }).
 */
export function getRcDelegationPricesQueryOptions(accessToken: string) {
  return queryOptions({
    queryKey: ["promotions", "rc-delegation-prices"],
    queryFn: async () => {
      if (!accessToken) {
        return [];
      }

      const response = await fetch(CONFIG.privateApiHost + "/private-api/rc-delegation-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: accessToken }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch RC delegation prices: ${response.status}`);
      }

      return (await response.json()) as PromotePrice[];
    },
    staleTime: Infinity,
    enabled: !!accessToken,
  });
}
