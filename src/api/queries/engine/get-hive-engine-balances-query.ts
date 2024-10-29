import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { TokenMetadata } from "@/entities";
import { HiveEngineToken } from "@/utils";
import { getTokenBalances, getTokens } from "@/api/hive-engine";
import { useMemo } from "react";
import { useGlobalStore } from "@/core/global-store";

export const getHiveEngineBalancesQuery = (account?: string) =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.HIVE_ENGINE_TOKEN_BALANCES],
    queryFn: async () => {
      if (!account) {
        throw new Error("[HiveEngine] No account in a balances query");
      }

      const balances = await getTokenBalances(account);
      const tokens = await getTokens(balances.map((t) => t.symbol));

      return balances.map((balance) => {
        const token = tokens.find((t) => t.symbol == balance.symbol);
        const tokenMetadata = token && (JSON.parse(token!.metadata) as TokenMetadata);

        return new HiveEngineToken({ ...balance, ...token, ...tokenMetadata } as any);
      });
    },
    enabled: !!account
  });

export function useHiveEngineAssetWallet(asset: string) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const { data: wallets } = getHiveEngineBalancesQuery(activeUser?.username).useClientQuery();

  return useMemo(() => wallets?.find((w) => w.symbol === asset), [wallets, asset]);
}
