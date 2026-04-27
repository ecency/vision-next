import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { callREST } from "@/modules/core/hive-tx";
import type { AggregatedBalanceEntry, BalanceCoinType } from "../types";

/**
 * Get aggregated balance history for an account (yearly summaries).
 * Uses the balance-api REST endpoint - enables daily/weekly/monthly summary
 * widgets that are impossible via RPC.
 *
 * @param username - Account name
 * @param coinType - HIVE, HBD, or VESTS
 */
export function getAggregatedBalanceQueryOptions(
  username?: string,
  coinType: BalanceCoinType = "HIVE"
) {
  return queryOptions({
    queryKey: QueryKeys.wallet.aggregatedHistory(
      username ?? "",
      coinType
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
        }
      )) as AggregatedBalanceEntry[];
    },

    enabled: !!username,
    staleTime: 60_000,
  });
}
