import { queryOptions } from "@tanstack/react-query";
import { getQueryClient } from "@/modules/core";
import type { GeneralAssetInfo } from "@/modules/wallet/types";
import { getHiveEngineTokensMetadataQueryOptions } from "./get-hive-engine-tokens-metadata-query-options";
import { getHiveEngineTokensBalancesQueryOptions } from "./get-hive-engine-tokens-balances-query-options";
import { getAllHiveEngineTokensQueryOptions } from "./get-all-hive-engine-tokens-query-options";
import { getHiveAssetGeneralInfoQueryOptions } from "@/modules/wallet/queries/get-hive-asset-general-info-query-options";

export function getHiveEngineTokenGeneralInfoQueryOptions(
  username?: string,
  symbol?: string
) {
  return queryOptions({
    queryKey: ["assets", "hive-engine", symbol, "general-info", username],
    enabled: !!symbol && !!username,
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      if (!symbol || !username) {
        throw new Error(
          "[SDK][HiveEngine] – token or username missed"
        );
      }
      const queryClient = getQueryClient();
      const hiveQuery = getHiveAssetGeneralInfoQueryOptions(username);
      await queryClient.prefetchQuery(hiveQuery);
      const hiveData = queryClient.getQueryData<GeneralAssetInfo>(
        hiveQuery.queryKey
      );

      const metadataList = await queryClient.ensureQueryData(
        getHiveEngineTokensMetadataQueryOptions([symbol])
      );

      const balanceList = await queryClient.ensureQueryData(
        getHiveEngineTokensBalancesQueryOptions(username)
      );

      // Scoped to this symbol: the unfiltered metrics call is capped at 1000 rows, so a
      // token outside that page reported no market and rendered a zero price.
      const marketList = await queryClient.ensureQueryData(
        getAllHiveEngineTokensQueryOptions(undefined, symbol)
      );

      const metadata = metadataList?.find((i) => i.symbol === symbol);
      const balance = balanceList?.find((i) => i.symbol === symbol);
      const market = marketList?.find((i) => i.symbol === symbol);

      const lastPrice = +(market?.lastPrice ?? "0");

      const liquidBalance = parseFloat(balance?.balance ?? "0");
      const stakedBalance = parseFloat(balance?.stake ?? "0");
      const unstakingBalance = parseFloat(balance?.pendingUnstake ?? "0");

      const parts: GeneralAssetInfo["parts"] = [
        { name: "liquid", balance: liquidBalance },
        { name: "staked", balance: stakedBalance },
      ];

      if (unstakingBalance > 0) {
        parts.push({ name: "unstaking", balance: unstakingBalance });
      }

      return {
        name: symbol,
        title: metadata?.name ?? "",
        price: lastPrice === 0 ? 0 : Number(lastPrice * (hiveData?.price ?? 0)),
        accountBalance: liquidBalance + stakedBalance,
        layer: "ENGINE",
        parts,
      } satisfies GeneralAssetInfo;
    },
  });
}
