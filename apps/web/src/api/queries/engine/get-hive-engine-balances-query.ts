import {
  getHiveEngineBalancesWithUsdQueryOptions,
  getAllHiveEngineTokensQueryOptions,
} from "@ecency/wallets";
import { getDynamicPropsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useGetHiveEngineBalancesQuery(account?: string) {
  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());
  const { data: allTokens } = useQuery(getAllHiveEngineTokensQueryOptions());

  return useQuery(
    getHiveEngineBalancesWithUsdQueryOptions(account ?? "", dynamicProps, allTokens)
  );
}

export function useHiveEngineAssetWallet(asset: string, account?: string) {
  const { data: wallets } = useGetHiveEngineBalancesQuery(account);
  return useMemo(() => wallets?.find((w) => w.symbol === asset), [wallets, asset]);
}
