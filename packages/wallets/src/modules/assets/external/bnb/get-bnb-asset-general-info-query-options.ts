import { queryOptions } from "@tanstack/react-query";
import { GeneralAssetInfo } from "../../types";
import { CONFIG } from "@ecency/sdk";
import { getBnbAssetBalanceQueryOptions } from "./get-bnb-asset-balance-query-options";
import { getCoinGeckoPriceQueryOptions } from "@/modules/wallets";
import { getAddressFromAccount } from "../common";

export function getBnbAssetGeneralInfoQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["assets", "bnb", "general-info", username],
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "BNB");

      await CONFIG.queryClient.fetchQuery(
        getBnbAssetBalanceQueryOptions(address)
      );
      const accountBalance =
        (CONFIG.queryClient.getQueryData<number>(
          getBnbAssetBalanceQueryOptions(address).queryKey
        ) ?? 0) / 1e18;

      await CONFIG.queryClient.prefetchQuery(
        getCoinGeckoPriceQueryOptions("BNB")
      );
      const price =
        CONFIG.queryClient.getQueryData<number>(
          getCoinGeckoPriceQueryOptions("BNB").queryKey
        ) ?? 0;

      return {
        name: "BNB",
        title: "Binance coin",
        price,
        accountBalance,
      } satisfies GeneralAssetInfo;
    },
  });
}
