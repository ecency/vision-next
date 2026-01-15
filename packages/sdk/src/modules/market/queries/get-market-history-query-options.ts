import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { MarketCandlestickDataItem } from "../types";

/**
 * Get HIVE/HBD market history (candlestick data)
 *
 * @param seconds - Bucket size in seconds
 * @param startDate - Start date for the data
 * @param endDate - End date for the data
 */
export function getMarketHistoryQueryOptions(
  seconds: number,
  startDate: Date,
  endDate: Date
) {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/\.\d{3}Z$/, "");
  };

  return queryOptions({
    queryKey: ["market", "history", seconds, startDate.getTime(), endDate.getTime()],
    queryFn: () =>
      CONFIG.hiveClient.call("condenser_api", "get_market_history", [
        seconds,
        formatDate(startDate),
        formatDate(endDate),
      ]) as Promise<MarketCandlestickDataItem[]>,
  });
}
