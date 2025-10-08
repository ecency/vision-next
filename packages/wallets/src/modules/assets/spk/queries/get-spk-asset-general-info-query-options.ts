import { getQueryClient } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { getHiveAssetGeneralInfoQueryOptions } from "../../hive";
import {
  GeneralAssetInfo,
  SpkApiWallet,
  TransformedSpkMarkets,
} from "../../types";
import { rewardSpk } from "../../utils";
import { getSpkMarketsQueryOptions } from "./get-spk-markets-query-options";
import { getSpkWalletQueryOptions } from "./get-spk-wallet-query-options";

function format(value: number) {
  return value.toFixed(3);
}

export function getSpkAssetGeneralInfoQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["assets", "spk", "general-info", username],
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
          name: "SPK",
          title: "SPK Network",
          price: 1,
          accountBalance: 0,
        };
      }

      const price = +format(
        ((wallet.gov + wallet.spk) / 1000) *
          +wallet.tick *
          (hiveAsset?.price ?? 0)
      );
      const accountBalance = +format(
        (wallet.spk +
          rewardSpk(
            wallet,
            market.raw.stats || {
              spk_rate_lgov: "0.001",
              spk_rate_lpow: format(
                parseFloat(market.raw.stats.spk_rate_lpow) * 100
              ),
              spk_rate_ldel: format(
                parseFloat(market.raw.stats.spk_rate_ldel) * 100
              ),
            }
          )) /
          1000
      );

      return {
        name: "SPK",
        title: "SPK Network",
        price: price / accountBalance,
        accountBalance,
      } satisfies GeneralAssetInfo;
    },
  });
}
