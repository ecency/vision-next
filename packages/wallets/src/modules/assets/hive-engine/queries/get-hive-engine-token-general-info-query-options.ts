import { queryOptions } from "@tanstack/react-query";
import { getQueryClient } from "@ecency/sdk";
import { GeneralAssetInfo } from "../../types";
import { getHiveEngineTokensMetadataQueryOptions } from "./get-hive-engine-tokens-metadata-query-options";
import { HiveEngineTokens } from "@/modules/wallets/consts";
import {
  HiveEngineMarketResponse,
  HiveEngineTokenBalance,
  HiveEngineTokenMetadataResponse,
} from "../types";
import { getHiveEngineTokensBalancesQueryOptions } from "./get-hive-engine-tokens-balances-query-options";
import { getHiveEngineTokensMarketQueryOptions } from "./get-hive-engine-tokens-market-query-options";
import { getHiveAssetGeneralInfoQueryOptions } from "../../hive/queries";

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
          "[SDK][Wallets] – hive engine token or username missed"
        );
      }
      const hiveQuery = getHiveAssetGeneralInfoQueryOptions(username);
      await getQueryClient().prefetchQuery(hiveQuery);
      const hiveData = getQueryClient().getQueryData<GeneralAssetInfo>(
        hiveQuery.queryKey
      );

      const metadataQuery =
        getHiveEngineTokensMetadataQueryOptions(HiveEngineTokens);
      await getQueryClient().prefetchQuery(metadataQuery);
      const metadataList = getQueryClient().getQueryData<
        HiveEngineTokenMetadataResponse[]
      >(metadataQuery.queryKey);

      const balancesQuery = getHiveEngineTokensBalancesQueryOptions(username);
      await getQueryClient().prefetchQuery(balancesQuery);
      const balanceList = getQueryClient().getQueryData<
        HiveEngineTokenBalance[]
      >(balancesQuery.queryKey);

      const marketQuery = getHiveEngineTokensMarketQueryOptions();
      await getQueryClient().prefetchQuery(marketQuery);
      const marketList = getQueryClient().getQueryData<
        HiveEngineMarketResponse[]
      >(marketQuery.queryKey);

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
