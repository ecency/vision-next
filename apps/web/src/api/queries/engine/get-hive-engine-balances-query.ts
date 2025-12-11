import { QueryIdentifiers } from "@/core/react-query";
import { TokenMetadata } from "@/entities";
import { HiveEngineToken } from "@/utils";
import { getTokenBalances, getTokens } from "@/api/hive-engine";
import { useMemo } from "react";
import {
import { useActiveAccount } from "@/core/hooks/use-active-account";
  DEFAULT_DYNAMIC_PROPS,
  getAllHiveEngineTokensQuery,
  getDynamicPropsQuery
} from "@/api/queries";
import { useQuery } from "@tanstack/react-query";

type DynamicProps = typeof DEFAULT_DYNAMIC_PROPS;
type TokenMetric = { symbol: string; lastPrice?: string | number };

export function useGetHiveEngineBalancesQuery(account?: string) {
  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();
  const { data: allTokens } = getAllHiveEngineTokensQuery().useClientQuery();

  return useQuery({
    queryKey: [QueryIdentifiers.HIVE_ENGINE_TOKEN_BALANCES, account, dynamicProps, allTokens],
    queryFn: async () => {
      if (!account) {
        throw new Error("[HiveEngine] No account in a balances query");
      }

      const balances = await getTokenBalances(account);
      const tokens = await getTokens(balances.map((t) => t.symbol));

      type HiveEngineTokenProps = ConstructorParameters<typeof HiveEngineToken>[0];

      // ✅ Narrow query results
      const dp = (dynamicProps ?? DEFAULT_DYNAMIC_PROPS) as DynamicProps;
      const metrics: ReadonlyArray<TokenMetric> = Array.isArray(allTokens) ? (allTokens as TokenMetric[]) : [];
      const pricePerHive = dp.quote ? dp.base / dp.quote : 0;

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
                    : Number((lastPrice * pricePerHive * balanceAmount).toFixed(10));

        const tokenProps: HiveEngineTokenProps = {
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
          usdValue
        };

        return new HiveEngineToken(tokenProps);
      });
    },
    enabled: !!account
  });
}

export function useHiveEngineAssetWallet(asset: string) {
  const { activeUser } = useActiveAccount();
  const { data: wallets } = useGetHiveEngineBalancesQuery(activeUser?.username);
  return useMemo(() => wallets?.find((w) => w.symbol === asset), [wallets, asset]);
}
