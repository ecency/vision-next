import { getHiveEngineTokensMarket } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { HiveEngineTokenInfo } from "../types";

/**
 * Get all Hive Engine tokens with optional filtering by account and symbol
 * @param account - Optional account to filter tokens by
 * @param symbol - Optional symbol to filter tokens by
 */
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
