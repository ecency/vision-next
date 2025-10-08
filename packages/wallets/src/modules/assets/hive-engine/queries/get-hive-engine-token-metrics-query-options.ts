import { CONFIG } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { HiveEngineMetric } from "../types";

export function getHiveEngineTokensMetricsQueryOptions(
  symbol: string,
  interval = "daily"
) {
  return queryOptions({
    queryKey: ["assets", "hive-engine", symbol],
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      const url = new URL(
        `${CONFIG.privateApiHost}/private-api/engine-chart-api`
      );
      url.searchParams.set("symbol", symbol);
      url.searchParams.set("interval", interval);

      const response = await fetch(url, {
        headers: { "Content-type": "application/json" },
      });
      return (await response.json()) as HiveEngineMetric[];
    },
  });
}
