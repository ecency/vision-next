import {
  DynamicProps,
  getAccountFullQueryOptions,
  getDynamicPropsQueryOptions,
  getQueryClient,
} from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { GeneralAssetInfo } from "../../types";
import { parseAsset } from "../../utils";
import { FullAccount } from "@ecency/sdk/dist/modules/accounts/types";

export function getHiveAssetGeneralInfoQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["assets", "hive", "general-info", username],
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      await getQueryClient().prefetchQuery(getDynamicPropsQueryOptions());
      await getQueryClient().prefetchQuery(
        getAccountFullQueryOptions(username)
      );

      const dynamicProps = getQueryClient().getQueryData<DynamicProps>(
        getDynamicPropsQueryOptions().queryKey
      );
      const accountData = getQueryClient().getQueryData<FullAccount>(
        getAccountFullQueryOptions(username).queryKey
      );

      return {
        name: "HIVE",
        title: "Hive",
        price: dynamicProps ? dynamicProps.base / dynamicProps.quote : 0,
        accountBalance: accountData
          ? parseAsset(accountData.balance).amount
          : 0,
      } satisfies GeneralAssetInfo;
    },
  });
}
