import { queryOptions } from "@tanstack/react-query";
import { EcencyWalletBasicTokens } from "../enums";
import {
  FullAccount,
  getAccountFullQueryOptions,
  getQueryClient,
} from "@ecency/sdk";

export function getAccountWalletListQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["ecency-wallets", "list", username],
    enabled: !!username,
    queryFn: async () => {
      const accountQuery = getAccountFullQueryOptions(username);
      await getQueryClient().fetchQuery({
        queryKey: accountQuery.queryKey,
      });
      const account = getQueryClient().getQueryData<FullAccount>(
        accountQuery.queryKey
      );
      if (account?.profile?.tokens instanceof Array) {
        const list = [
          EcencyWalletBasicTokens.Points,
          EcencyWalletBasicTokens.Hive,
          EcencyWalletBasicTokens.HivePower,
          EcencyWalletBasicTokens.HiveDollar,
          ...account.profile.tokens
            .filter(({ meta }) => !!meta?.show)
            .map((token) => token.symbol),
        ];

        return Array.from(new Set(list).values());
      }

      return [
        EcencyWalletBasicTokens.Points,
        EcencyWalletBasicTokens.Hive,
        EcencyWalletBasicTokens.HivePower,
        EcencyWalletBasicTokens.HiveDollar,
        EcencyWalletBasicTokens.Spk,
      ];
    },
  });
}
