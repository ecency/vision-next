import { QueryIdentifiers } from "@/core/react-query";
import { TokenMetadata } from "@/entities";
import { HiveEngineToken } from "@/utils";
import { getTokenBalances, getTokens } from "@/api/hive-engine";
import { useMemo } from "react";
import { useGlobalStore } from "@/core/global-store";
import {
  DEFAULT_DYNAMIC_PROPS,
  getAllHiveEngineTokensQuery,
  getDynamicPropsQuery
} from "@/api/queries";
import { useQuery } from "@tanstack/react-query";

export function useGetHiveEngineBalancesQuery(account?: string) {
  const { data: dynamicProps = DEFAULT_DYNAMIC_PROPS } = getDynamicPropsQuery().useClientQuery();
  const { data: allTokens } = getAllHiveEngineTokensQuery().useClientQuery();

  return useQuery({
    queryKey: [QueryIdentifiers.HIVE_ENGINE_TOKEN_BALANCES, account, dynamicProps, allTokens],
    queryFn: async () => {
      if (!account) {
        throw new Error("[HiveEngine] No account in a balances query");
      }

      const balances = await getTokenBalances(account);
      const tokens = await getTokens(balances.map((t) => t.symbol));

      return balances.map((balance) => {
        const token = tokens.find((t) => t.symbol == balance.symbol);
        const tokenMetadata = token && (JSON.parse(token!.metadata) as TokenMetadata);

        const pricePerHive =
          (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).base /
          (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).quote;
        const metric = allTokens?.find((m) => m.symbol === balance.symbol);
        const lastPrice = +(metric?.lastPrice ?? "0");

        return new HiveEngineToken({
          ...balance,
          ...token,
          ...tokenMetadata,
          usdValue:
            balance.symbol === "SWAP.HIVE"
              ? Number(pricePerHive * +balance.balance)
              : lastPrice === 0
                ? 0
                : Number(lastPrice * pricePerHive * +balance.balance).toFixed(10)
        } as any);
      });
    },
    enabled: !!account
  });
}

export function useHiveEngineAssetWallet(asset: string) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const { data: wallets } = useGetHiveEngineBalancesQuery(activeUser?.username);

  return useMemo(() => wallets?.find((w) => w.symbol === asset), [wallets, asset]);
}
