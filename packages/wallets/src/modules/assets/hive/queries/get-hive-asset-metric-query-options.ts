import { infiniteQueryOptions } from "@tanstack/react-query";
import { HiveMarketMetric } from "../types";
import { CONFIG } from "@ecency/sdk";
import dayjs from "dayjs";

export function getHiveAssetMetricQueryOptions(bucketSeconds = 86_400) {
  return infiniteQueryOptions({
    queryKey: ["assets", "hive", "metrics", bucketSeconds],
    queryFn: async ({ pageParam: [startDate, endDate] }) => {
      const apiData: HiveMarketMetric[] = await CONFIG.hiveClient.call(
        "condenser_api",
        "get_market_history",
        [
          bucketSeconds,
          dayjs(startDate).format("YYYY-MM-DDTHH:mm:ss"),
          dayjs(endDate).format("YYYY-MM-DDTHH:mm:ss"),
        ],
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
      // Fetch at least 8 hours or given interval
      dayjs()
        .subtract(Math.max(100 * bucketSeconds, 28_800), "second")
        .toDate(),
      new Date(),
    ],
    getNextPageParam: (_, __, [prevStartDate]) => [
      dayjs(prevStartDate.getTime())
        .subtract(Math.max(100 * bucketSeconds, 28_800), "second")
        .toDate(),
      dayjs(prevStartDate.getTime()).subtract(bucketSeconds, "second").toDate(),
    ],
  });
}
