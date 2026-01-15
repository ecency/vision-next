import { getHiveEngineTokensBalances } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { HiveEngineTokenBalance } from "../types";

export function getHiveEngineTokensBalancesQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["assets", "hive-engine", "balances", username] as const,
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      return getHiveEngineTokensBalances<HiveEngineTokenBalance>(username);
    },
  });
}
