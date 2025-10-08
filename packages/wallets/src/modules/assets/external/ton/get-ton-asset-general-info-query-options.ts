import { queryOptions } from "@tanstack/react-query";
import { GeneralAssetInfo } from "../../types";
import { CONFIG } from "@ecency/sdk";
import { getTonAssetBalanceQueryOptions } from "./get-ton-asset-balance-query-options";
import { getCoinGeckoPriceQueryOptions } from "@/modules/wallets";
import { getAddressFromAccount } from "../common";

export function getTonAssetGeneralInfoQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["assets", "ton", "general-info", username],
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "TON");

      await CONFIG.queryClient.fetchQuery(
        getTonAssetBalanceQueryOptions(address)
      );
      const accountBalance =
        (CONFIG.queryClient.getQueryData<number>(
          getTonAssetBalanceQueryOptions(address).queryKey
        ) ?? 0) / 1e9;

      await CONFIG.queryClient.prefetchQuery(
        getCoinGeckoPriceQueryOptions("TON")
      );
      const price =
        CONFIG.queryClient.getQueryData<number>(
          getCoinGeckoPriceQueryOptions("TON").queryKey
        ) ?? 0;

      return {
        name: "TON",
        title: "The open network",
        price,
        accountBalance,
      } satisfies GeneralAssetInfo;
    },
  });
}
