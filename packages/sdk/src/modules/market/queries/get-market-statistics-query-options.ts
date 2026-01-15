import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { MarketStatistics } from "../types";

/**
 * Get HIVE/HBD market statistics from the blockchain
 */
export function getMarketStatisticsQueryOptions() {
  return queryOptions({
    queryKey: ["market", "statistics"],
    queryFn: () =>
      CONFIG.hiveClient.call("condenser_api", "get_ticker", []) as Promise<MarketStatistics>,
  });
}
