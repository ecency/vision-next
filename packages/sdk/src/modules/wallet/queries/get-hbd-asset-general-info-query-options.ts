import type { DynamicProps } from "@/modules/core";
import { getAccountFullQueryOptions } from "@/modules/accounts";
import { getDynamicPropsQueryOptions, getQueryClient } from "@/modules/core";
import type { FullAccount } from "@/modules/accounts";
import { queryOptions } from "@tanstack/react-query";
import type { GeneralAssetInfo } from "../types";
import { parseAsset } from "@/modules/core/utils";

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

      const price = 1;

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
