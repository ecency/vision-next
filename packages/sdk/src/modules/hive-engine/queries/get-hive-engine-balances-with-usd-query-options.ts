import { getHiveEngineTokensBalances, getHiveEngineTokensMetadata } from "../requests";
import { queryOptions } from "@tanstack/react-query";
import type {
  HiveEngineTokenBalance,
  Token,
  TokenMetadata,
  HiveEngineTokenInfo,
} from "../types";
import { HiveEngineToken } from "../utils";

interface DynamicProps {
  base: number;
  quote: number;
}

export function getHiveEngineBalancesWithUsdQueryOptions(
  account: string,
  dynamicProps?: DynamicProps,
  allTokens?: HiveEngineTokenInfo[]
) {
  return queryOptions({
    queryKey: [
      "assets",
      "hive-engine",
      "balances-with-usd",
      account,
      dynamicProps,
      allTokens,
    ] as const,
    queryFn: async () => {
      if (!account) {
        throw new Error("[HiveEngine] No account in a balances query");
      }

      const balances = await getHiveEngineTokensBalances<HiveEngineTokenBalance>(account);

      const tokens = await getHiveEngineTokensMetadata<Token>(
        balances.map((t) => t.symbol)
      );

      const pricePerHive = dynamicProps
        ? dynamicProps.base / dynamicProps.quote
        : 0;
      const metrics: ReadonlyArray<HiveEngineTokenInfo> = Array.isArray(
        allTokens
      )
        ? allTokens
        : [];

      return balances.map((balance) => {
        const token = tokens.find((t) => t.symbol === balance.symbol);
        let tokenMetadata: TokenMetadata | undefined;

        if (token?.metadata) {
          try {
            tokenMetadata = JSON.parse(token.metadata) as TokenMetadata;
          } catch {
            tokenMetadata = undefined;
          }
        }

        const metric = metrics.find((m) => m.symbol === balance.symbol);
        const lastPrice = Number(metric?.lastPrice ?? "0");
        const balanceAmount = Number(balance.balance);

        const usdValue =
          balance.symbol === "SWAP.HIVE"
            ? pricePerHive * balanceAmount
            : lastPrice === 0
              ? 0
              : Number(
                  (lastPrice * pricePerHive * balanceAmount).toFixed(10)
                );

        return new HiveEngineToken({
          symbol: balance.symbol,
          name: token?.name ?? balance.symbol,
          icon: tokenMetadata?.icon ?? "",
          precision: token?.precision ?? 0,
          stakingEnabled: token?.stakingEnabled ?? false,
          delegationEnabled: token?.delegationEnabled ?? false,
          balance: balance.balance,
          stake: balance.stake,
          delegationsIn: balance.delegationsIn,
          delegationsOut: balance.delegationsOut,
          usdValue,
        });
      });
    },
    enabled: !!account,
  });
}
