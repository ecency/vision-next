import { queryOptions } from "@tanstack/react-query";
import type { HiveEngineMarketResponse } from "../types";
import { getHiveEngineTokensMarket } from "../requests";

export function getHiveEngineTokensMarketQueryOptions() {
  return queryOptions({
    queryKey: ["assets", "hive-engine", "markets"],
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      return getHiveEngineTokensMarket<HiveEngineMarketResponse>();
    },
  });
}
