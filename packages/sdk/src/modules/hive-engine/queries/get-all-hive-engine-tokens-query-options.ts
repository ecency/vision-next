import { getHiveEngineTokensMarket } from "../requests";
import { queryOptions } from "@tanstack/react-query";
import type { HiveEngineTokenInfo } from "../types";

export function getAllHiveEngineTokensQueryOptions(
  account?: string,
  symbol?: string
) {
  return queryOptions({
    queryKey: ["assets", "hive-engine", "all-tokens", account, symbol] as const,
    queryFn: async () => {
      return getHiveEngineTokensMarket<HiveEngineTokenInfo>(account, symbol);
    },
  });
}
