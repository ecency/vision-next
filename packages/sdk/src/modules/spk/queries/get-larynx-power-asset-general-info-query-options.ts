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

export function getLarynxPowerAssetGeneralInfoQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["assets", "larynx-power", "general-info", username],
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
          name: "LP",
          title: "SPK Network / LARYNX Power",
          price: 1,
          accountBalance: 0,
        };
      }

      const price = +format(
        (wallet.poweredUp / 1000) * +wallet.tick * (hiveAsset?.price ?? 0)
      );
      const accountBalance = +format(wallet.poweredUp / 1000);

      return {
        name: "LP",
        title: "LARYNX Power",
        layer: "SPK",
        price: price / accountBalance,
        accountBalance,
        parts: [
          {
            name: "delegating",
            balance: wallet.granting?.t ? +format(wallet.granting.t / 1000) : 0,
          },
          {
            name: "recieved",
            balance: wallet.granted?.t ? +format(wallet.granted.t / 1000) : 0,
          },
        ],
      } satisfies GeneralAssetInfo;
    },
  });
}
