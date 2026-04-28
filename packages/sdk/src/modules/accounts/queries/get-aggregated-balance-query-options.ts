import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { callREST } from "@/modules/core/hive-tx";
import type { AggregatedBalanceEntry, BalanceCoinType } from "../types";

export type BalanceAggregationGranularity = "yearly" | "monthly" | "daily";

/**
 * Get aggregated balance history for an account.
 * Uses the balance-api REST endpoint - enables yearly/monthly/daily summary
 * widgets that are impossible via RPC.
 *
 * @param username - Account name
 * @param coinType - HIVE, HBD, or VESTS
 * @param granularity - yearly (default), monthly, or daily
 */
export function getAggregatedBalanceQueryOptions(
  username?: string,
  coinType: BalanceCoinType = "HIVE",
  granularity: BalanceAggregationGranularity = "yearly"
) {
  return queryOptions({
    queryKey: QueryKeys.wallet.aggregatedHistory(
      username ?? "",
      coinType,
      granularity
    ),

    queryFn: async () => {
      if (!username) {
        return [];
      }

      return (await callREST(
        "balance",
        "/accounts/{account-name}/aggregated-history",
        {
          "account-name": username,
          "coin-type": coinType,
          granularity,
        }
      )) as AggregatedBalanceEntry[];
    },

    enabled: !!username,
    staleTime: 60_000,
  });
}
