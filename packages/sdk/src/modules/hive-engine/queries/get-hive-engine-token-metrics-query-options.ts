import { getHiveEngineTokenMetrics } from "../requests";
import { queryOptions } from "@tanstack/react-query";
import type { HiveEngineMetric } from "../types";

export function getHiveEngineTokensMetricsQueryOptions(
  symbol: string,
  interval = "daily"
) {
  return queryOptions({
    queryKey: ["assets", "hive-engine", symbol],
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      return getHiveEngineTokenMetrics<HiveEngineMetric>(symbol, interval);
    },
  });
}
