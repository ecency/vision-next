import { queryOptions } from "@tanstack/react-query";
import { HiveEngineMarketResponse } from "../types";
import { getHiveEngineTokensMarket } from "@ecency/sdk";

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
