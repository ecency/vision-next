import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";

export interface FeedHistoryItem {
  id: number;
  current_median_history: {
    base: string;
    quote: string;
  };
  market_median_history: {
    base: string;
    quote: string;
  };
  current_min_history: {
    base: string;
    quote: string;
  };
  current_max_history: {
    base: string;
    quote: string;
  };
  price_history: Array<{
    base: string;
    quote: string;
  }>;
}

/**
 * Get feed history from the blockchain
 * Returns price feed history including median prices
 */
export function getFeedHistoryQueryOptions() {
  return queryOptions({
    queryKey: ["market", "feed-history"],
    queryFn: async () => {
      try {
        const feedHistory = await CONFIG.hiveClient.database.call("get_feed_history");
        return feedHistory as FeedHistoryItem;
      } catch (error) {
        throw error;
      }
    },
  });
}
