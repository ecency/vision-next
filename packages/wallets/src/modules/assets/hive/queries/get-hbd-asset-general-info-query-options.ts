import {
  DynamicProps,
  getAccountFullQueryOptions,
  getDynamicPropsQueryOptions,
  getQueryClient,
  CONFIG,
} from "@ecency/sdk";
import { type FullAccount } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { GeneralAssetInfo } from "../../types";
import { parseAsset } from "../../utils";
import { getTokenPriceQueryOptions } from "@/modules/wallets";

export function getHbdAssetGeneralInfoQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["assets", "hbd", "general-info", username],
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      await getQueryClient().prefetchQuery(getDynamicPropsQueryOptions());
      await getQueryClient().prefetchQuery(
        getAccountFullQueryOptions(username)
      );

      const accountData = getQueryClient().getQueryData<FullAccount>(
        getAccountFullQueryOptions(username).queryKey
      );
      const dynamicProps = getQueryClient().getQueryData<DynamicProps>(
        getDynamicPropsQueryOptions().queryKey
      );

      let price = 1;
      try {
        await CONFIG.queryClient.prefetchQuery(
            getTokenPriceQueryOptions("HBD")
        );
        const marketPrice =
            CONFIG.queryClient.getQueryData<number>(
                getTokenPriceQueryOptions("HBD").queryKey
            ) ?? 0;

        if (typeof marketPrice === "number" && Number.isFinite(marketPrice)) {
          price = marketPrice;
        }
      } catch {
        // Ignore private API failures and fall back to the peg value.
      }

      if (!accountData) {
        return {
          name: "HBD",
          title: "Hive Dollar",
          price,
          accountBalance: 0,
        };
      }

      return {
        name: "HBD",
        title: "Hive Dollar",
        price,
        accountBalance:
          parseAsset(accountData.hbd_balance).amount +
          parseAsset(accountData?.savings_hbd_balance).amount,
        apr: ((dynamicProps?.hbdInterestRate ?? 0) / 100).toFixed(3),
        parts: [
          {
            name: "current",
            balance: parseAsset(accountData.hbd_balance).amount,
          },
          {
            name: "savings",
            balance: parseAsset(accountData.savings_hbd_balance).amount,
          },
        ],
      } satisfies GeneralAssetInfo;
    },
  });
}
