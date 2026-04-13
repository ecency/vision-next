import { queryOptions } from "@tanstack/react-query";
import { callRPC } from "@/modules/core/hive-tx";

export interface MedianHistoryPrice {
  base: string;
  quote: string;
}

/**
 * Get current median history price from the blockchain
 * Returns the current median price for HIVE/HBD conversion
 */
export function getCurrentMedianHistoryPriceQueryOptions() {
  return queryOptions({
    queryKey: ["market", "current-median-history-price"],
    queryFn: async () => {
      try {
        const price = await callRPC("condenser_api.get_current_median_history_price", []);
        return price as MedianHistoryPrice;
      } catch (error) {
        throw error;
      }
    },
  });
}
