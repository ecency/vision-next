import { queryOptions } from "@tanstack/react-query";
import { EcencyWalletBasicTokens } from "../enums";
import {
  AccountProfile,
  FullAccount,
  getAccountFullQueryOptions,
  getQueryClient,
} from "@ecency/sdk";
import { getVisionPortfolioQueryOptions } from "./get-vision-portfolio-query-options";

type ProfileTokens = AccountProfile["tokens"];
type ProfileToken = NonNullable<ProfileTokens>[number];

function normalizeAccountTokens(tokens: ProfileTokens): ProfileToken[] {
  if (Array.isArray(tokens)) {
    return tokens.filter(Boolean) as ProfileToken[];
  }

  if (tokens && typeof tokens === "object") {
    return Object.values(tokens).flatMap((value) =>
      Array.isArray(value) ? (value.filter(Boolean) as ProfileToken[]) : []
    );
  }

  return [];
}

const BASIC_TOKENS: string[] = [
  EcencyWalletBasicTokens.Points,
  EcencyWalletBasicTokens.Hive,
  EcencyWalletBasicTokens.HivePower,
  EcencyWalletBasicTokens.HiveDollar,
];

export function getAccountWalletListQueryOptions(username: string, currency: string = "usd") {
  return queryOptions({
    queryKey: ["ecency-wallets", "list", username, currency],
    enabled: !!username,
    queryFn: async () => {
      const portfolioQuery = getVisionPortfolioQueryOptions(username, currency);
      const queryClient = getQueryClient();
      const accountQuery = getAccountFullQueryOptions(username);

      let account: FullAccount | undefined;

      try {
        account = await queryClient.fetchQuery(accountQuery);
      } catch {
        // Best effort; fall back to defaults if account metadata is not available.
      }

      const tokenVisibility = new Map<string, boolean>();

      const accountTokens = normalizeAccountTokens(account?.profile?.tokens);

      accountTokens.forEach((token: ProfileToken) => {
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
          (asset) => asset.name
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

      if (accountTokens.length > 0) {
        const list = [
          ...BASIC_TOKENS,
          ...accountTokens
            .map((token: ProfileToken) => token.symbol)
            .filter(isTokenVisible),
        ];

        return Array.from(new Set(list).values());
      }

      return [...BASIC_TOKENS];
    },
  });
}
