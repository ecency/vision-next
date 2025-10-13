import { queryOptions } from "@tanstack/react-query";
import { GeneralAssetInfo } from "../../types";
import { CONFIG } from "@ecency/sdk";
import { getTronAssetBalanceQueryOptions } from "./get-tron-asset-balance-query-options";
import { getTokenPriceQueryOptions } from "@/modules/wallets";
import { getAddressFromAccount } from "../common";

export function getTronAssetGeneralInfoQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["assets", "tron", "general-info", username],
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      const address = await getAddressFromAccount(username, "TRX");
      await CONFIG.queryClient.fetchQuery(
        getTronAssetBalanceQueryOptions(address)
      );
      const accountBalance =
        (CONFIG.queryClient.getQueryData<number>(
          getTronAssetBalanceQueryOptions(address).queryKey
        ) ?? 0) / 1e6;

      await CONFIG.queryClient.prefetchQuery(
        getTokenPriceQueryOptions("TRX")
      );
      const price =
        CONFIG.queryClient.getQueryData<number>(
          getTokenPriceQueryOptions("TRX").queryKey
        ) ?? 0;

      return {
        name: "TRX",
        title: "Tron",
        price,
        accountBalance,
      } satisfies GeneralAssetInfo;
    },
  });
}
