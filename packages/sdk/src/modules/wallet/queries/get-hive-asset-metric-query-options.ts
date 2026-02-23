import { infiniteQueryOptions } from "@tanstack/react-query";
import type { HiveMarketMetric } from "../types";
import { CONFIG } from "@/modules/core/config";

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function subtractSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() - seconds * 1000);
}

export function getHiveAssetMetricQueryOptions(bucketSeconds = 86_400) {
  return infiniteQueryOptions({
    queryKey: ["assets", "hive", "metrics", bucketSeconds],
    queryFn: async ({ pageParam: [startDate, endDate] }) => {
      const apiData: HiveMarketMetric[] = await CONFIG.hiveClient.call(
        "condenser_api",
        "get_market_history",
        [bucketSeconds, formatDate(startDate), formatDate(endDate)]
      );

      return apiData.map(({ hive, non_hive, open }) => ({
        close: non_hive.close / hive.close,
        open: non_hive.open / hive.open,
        low: non_hive.low / hive.low,
        high: non_hive.high / hive.high,
        volume: hive.volume,
        time: new Date(open),
      }));
    },
    initialPageParam: [
      subtractSeconds(new Date(), Math.max(100 * bucketSeconds, 28_800)),
      new Date(),
    ],
    getNextPageParam: (_, __, [prevStartDate]) => [
      subtractSeconds(prevStartDate, Math.max(100 * bucketSeconds, 28_800)),
      subtractSeconds(prevStartDate, bucketSeconds),
    ],
  });
}
