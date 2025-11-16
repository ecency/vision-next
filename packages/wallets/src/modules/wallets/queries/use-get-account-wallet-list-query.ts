import { queryOptions } from "@tanstack/react-query";
import { EcencyWalletBasicTokens } from "../enums";
import {
  FullAccount,
  getAccountFullQueryOptions,
  getQueryClient,
} from "@ecency/sdk";
import { getVisionPortfolioQueryOptions } from "./get-vision-portfolio-query-options";

export function getAccountWalletListQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["ecency-wallets", "list", username],
    enabled: !!username,
    queryFn: async () => {
      const portfolioQuery = getVisionPortfolioQueryOptions(username);
      const queryClient = getQueryClient();

      try {
        const portfolio = await queryClient.fetchQuery(portfolioQuery);
        const tokensFromPortfolio = portfolio.wallets.map(
          (asset) => asset.info.name
        );

        if (tokensFromPortfolio.length > 0) {
          return Array.from(new Set(tokensFromPortfolio));
        }
      } catch {
        // Fallback to legacy behaviour when the portfolio endpoint is not accessible.
      }

      const accountQuery = getAccountFullQueryOptions(username);
      await queryClient.fetchQuery({
        queryKey: accountQuery.queryKey,
      });
      const account = queryClient.getQueryData<FullAccount>(
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
        EcencyWalletBasicTokens.HiveDollar
      ];
    },
  });
}
