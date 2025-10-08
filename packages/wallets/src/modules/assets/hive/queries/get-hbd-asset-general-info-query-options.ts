import {
  DynamicProps,
  getAccountFullQueryOptions,
  getDynamicPropsQueryOptions,
  getQueryClient,
} from "@ecency/sdk";
import { FullAccount } from "@ecency/sdk/dist/modules/accounts/types";
import { queryOptions } from "@tanstack/react-query";
import { GeneralAssetInfo } from "../../types";
import { parseAsset } from "../../utils";

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

      if (!accountData) {
        return {
          name: "HBD",
          title: "Hive-based dollar",
          price: 1,
          accountBalance: 0,
        };
      }

      return {
        name: "HBD",
        title: "Hive-based dollar",
        price: 1,
        accountBalance:
          parseAsset(accountData.hbd_balance).amount +
          parseAsset(accountData?.savings_hbd_balance).amount,
        apr: ((dynamicProps?.hbdInterestRate ?? 0) / 100).toFixed(3),
        parts: [
          {
            name: "account",
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
