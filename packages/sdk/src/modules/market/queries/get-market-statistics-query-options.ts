import { queryOptions } from "@tanstack/react-query";
import { MarketStatistics } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

/**
 * Get HIVE/HBD market statistics from the blockchain
 */
export function getMarketStatisticsQueryOptions() {
  return queryOptions({
    queryKey: ["market", "statistics"],
    queryFn: () =>
      callRPC("condenser_api.get_ticker", []) as Promise<MarketStatistics>,
  });
}
