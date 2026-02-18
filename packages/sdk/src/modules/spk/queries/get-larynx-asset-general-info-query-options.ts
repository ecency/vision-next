import { getQueryClient } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { getHiveAssetGeneralInfoQueryOptions } from "@/modules/wallet/queries/get-hive-asset-general-info-query-options";
import type { GeneralAssetInfo } from "@/modules/wallet/types";
import type { SpkApiWallet, TransformedSpkMarkets } from "../types";
import { getSpkMarketsQueryOptions } from "./get-spk-markets-query-options";
import { getSpkWalletQueryOptions } from "./get-spk-wallet-query-options";

function format(value: number) {
  return value.toFixed(3);
}

export function getLarynxAssetGeneralInfoQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["assets", "larynx", "general-info", username],
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      await getQueryClient().prefetchQuery(getSpkWalletQueryOptions(username));
      await getQueryClient().prefetchQuery(getSpkMarketsQueryOptions());
      await getQueryClient().prefetchQuery(
        getHiveAssetGeneralInfoQueryOptions(username)
      );

      const wallet = getQueryClient().getQueryData<SpkApiWallet>(
        getSpkWalletQueryOptions(username).queryKey
      );
      const market = getQueryClient().getQueryData<TransformedSpkMarkets>(
        getSpkMarketsQueryOptions().queryKey
      );
      const hiveAsset = getQueryClient().getQueryData<GeneralAssetInfo>(
        getHiveAssetGeneralInfoQueryOptions(username).queryKey
      );

      if (!wallet || !market) {
        return {
          name: "LARYNX",
          title: "SPK Network / LARYNX",
          price: 1,
          accountBalance: 0,
        };
      }

      const price = +format(
        (wallet.balance / 1000) * +wallet.tick * (hiveAsset?.price ?? 0)
      );
      const accountBalance = +format(wallet.balance / 1000);

      return {
        name: "LARYNX",
        layer: "SPK",
        title: "LARYNX",
        price: price / accountBalance,
        accountBalance,
      } satisfies GeneralAssetInfo;
    },
  });
}
