import { queryOptions } from "@tanstack/react-query";
import { EcencyWalletBasicTokens } from "../enums";
import {
  FullAccount,
  getAccountFullQueryOptions,
  getQueryClient,
} from "@ecency/sdk";
import { getVisionPortfolioQueryOptions } from "./get-vision-portfolio-query-options";

const BASIC_TOKENS: string[] = [
  EcencyWalletBasicTokens.Points,
  EcencyWalletBasicTokens.Hive,
  EcencyWalletBasicTokens.HivePower,
  EcencyWalletBasicTokens.HiveDollar,
];

export function getAccountWalletListQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["ecency-wallets", "list", username],
    enabled: !!username,
    queryFn: async () => {
      const portfolioQuery = getVisionPortfolioQueryOptions(username);
      const queryClient = getQueryClient();
      const accountQuery = getAccountFullQueryOptions(username);

      let account: FullAccount | undefined;

      try {
        account = await queryClient.fetchQuery(accountQuery);
      } catch {
        // Best effort; fall back to defaults if account metadata is not available.
      }

      const tokenVisibility = new Map<string, boolean>();

      account?.profile?.tokens?.forEach((token) => {
        const symbol = token.symbol?.toUpperCase?.();

        if (!symbol) {
          return;
        }

        const showValue = (token as any)?.meta?.show;

        if (typeof showValue === "boolean") {
          tokenVisibility.set(symbol, showValue);
        }
      });

      const isTokenVisible = (symbol?: string) => {
        const normalized = symbol?.toUpperCase();

        if (!normalized) {
          return false;
        }

        if (BASIC_TOKENS.includes(normalized)) {
          return true;
        }

        return tokenVisibility.get(normalized) === true;
      };

      try {
        const portfolio = await queryClient.fetchQuery(portfolioQuery);
        const tokensFromPortfolio = portfolio.wallets.map(
          (asset) => asset.info.name
        );

        if (tokensFromPortfolio.length > 0) {
          const visibleTokens = tokensFromPortfolio
            .map((token) => token?.toUpperCase?.())
            .filter((token): token is string => Boolean(token))
            .filter(isTokenVisible);

          if (visibleTokens.length > 0) {
            return Array.from(new Set(visibleTokens));
          }
        }
      } catch {
        // Fallback to legacy behaviour when the portfolio endpoint is not accessible.
      }

      if (account?.profile?.tokens instanceof Array) {
        const list = [
          ...BASIC_TOKENS,
          ...account.profile.tokens
            .map((token) => token.symbol)
            .filter(isTokenVisible),
        ];

        return Array.from(new Set(list).values());
      }

      return [...BASIC_TOKENS];
    },
  });
}
