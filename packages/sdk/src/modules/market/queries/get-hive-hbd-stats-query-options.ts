import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { HiveHbdStats, MarketCandlestickDataItem, MarketStatistics } from "../types";

/**
 * Get combined HIVE/HBD statistics including price, 24h change, and volume
 */
export function getHiveHbdStatsQueryOptions() {
  return queryOptions({
    queryKey: ["market", "hive-hbd-stats"],
    queryFn: async () => {
      // Get current market statistics
      const stats = (await CONFIG.hiveClient.call(
        "condenser_api",
        "get_ticker",
        []
      )) as MarketStatistics;

      // Get 24h market history
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 86400000); // 24 hours ago

      const formatDate = (date: Date) => {
        return date.toISOString().replace(/\.\d{3}Z$/, "");
      };

      const dayChange = (await CONFIG.hiveClient.call(
        "condenser_api",
        "get_market_history",
        [86400, formatDate(oneDayAgo), formatDate(now)]
      )) as MarketCandlestickDataItem[];

      // Calculate stats
      const result: HiveHbdStats = {
        price: +stats.latest,
        close: dayChange[0] ? dayChange[0].non_hive.open / dayChange[0].hive.open : 0,
        high: dayChange[0] ? dayChange[0].non_hive.high / dayChange[0].hive.high : 0,
        low: dayChange[0] ? dayChange[0].non_hive.low / dayChange[0].hive.low : 0,
        percent: dayChange[0]
          ? 100 - ((dayChange[0].non_hive.open / dayChange[0].hive.open) * 100) / +stats.latest
          : 0,
        totalFromAsset: stats.hive_volume.split(" ")[0],
        totalToAsset: stats.hbd_volume.split(" ")[0],
      };

      return result;
    },
  });
}
