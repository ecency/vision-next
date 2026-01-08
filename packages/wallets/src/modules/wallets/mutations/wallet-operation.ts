import {
  AssetOperation,
  delegateEngineToken,
  delegateHive,
  getHiveEngineTokensBalancesQueryOptions,
  HiveEngineTokenBalance,
  lockLarynx,
  powerDownHive,
  powerUpHive,
  stakeEngineToken,
  transferEngineToken,
  transferHive,
  transferPoint,
  transferSpk,
  transferToSavingsHive,
  transferFromSavingsHive,
  undelegateEngineToken,
  unstakeEngineToken,
  withdrawVestingRouteHive,
  powerUpLarynx,
  transferLarynx,
  claimInterestHive,
} from "@/modules/assets";
import { EcencyAnalytics, getQueryClient } from "@ecency/sdk";
import type { AuthContext } from "@ecency/sdk";
import { useMutation } from "@tanstack/react-query";
import { getAccountWalletAssetInfoQueryOptions } from "../queries";

const operationToFunctionMap: Record<
  string,
  Partial<Record<AssetOperation, any>>
> = {
  HIVE: {
    [AssetOperation.Transfer]: transferHive,
    [AssetOperation.TransferToSavings]: transferToSavingsHive,
    [AssetOperation.WithdrawFromSavings]: transferFromSavingsHive,
    [AssetOperation.PowerUp]: powerUpHive,
  },
  HBD: {
    [AssetOperation.Transfer]: transferHive,
    [AssetOperation.TransferToSavings]: transferToSavingsHive,
    [AssetOperation.WithdrawFromSavings]: transferFromSavingsHive,
    [AssetOperation.ClaimInterest]: claimInterestHive,
  },
  HP: {
    [AssetOperation.PowerDown]: powerDownHive,
    [AssetOperation.Delegate]: delegateHive,
    [AssetOperation.WithdrawRoutes]: withdrawVestingRouteHive,
  },
  POINTS: {
    [AssetOperation.Transfer]: transferPoint,
    [AssetOperation.Gift]: transferPoint,
  },
  SPK: {
    [AssetOperation.Transfer]: transferSpk,
  },
  LARYNX: {
    [AssetOperation.Transfer]: transferLarynx,
    [AssetOperation.LockLiquidity]: lockLarynx,
    [AssetOperation.PowerUp]: powerUpLarynx,
  },
};

const engineOperationToFunctionMap: Partial<Record<AssetOperation, any>> = {
  [AssetOperation.Transfer]: transferEngineToken,
  [AssetOperation.Stake]: stakeEngineToken,
  [AssetOperation.Unstake]: unstakeEngineToken,
  [AssetOperation.Delegate]: delegateEngineToken,
  [AssetOperation.Undelegate]: undelegateEngineToken,
};

export function useWalletOperation(
  username: string,
  asset: string,
  operation: AssetOperation,
  auth?: AuthContext
) {
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    username,
    operation as any
  );

  return useMutation({
    mutationKey: ["ecency-wallets", asset, operation],
    mutationFn: async (payload: Record<string, unknown>) => {
      const operationFn = operationToFunctionMap[asset]?.[operation];
      if (operationFn) {
        return operationFn(payload, auth);
      }

      // Handle Hive engine ops
      const balancesListQuery =
        getHiveEngineTokensBalancesQueryOptions(username);
      await getQueryClient().prefetchQuery(balancesListQuery);
      const balances = getQueryClient().getQueryData<HiveEngineTokenBalance[]>(
        balancesListQuery.queryKey
      );

      const engineBalances = (balances ?? []) as HiveEngineTokenBalance[];
      if (engineBalances.some((balance) => balance.symbol === asset)) {
        const operationFn = engineOperationToFunctionMap[operation];
        if (operationFn) {
          return operationFn({ ...payload, asset }, auth);
        }
      }

      throw new Error("[SDK][Wallets] – no operation for given asset");
    },
    onSuccess: () => {
      recordActivity();

      const assetsToRefresh = new Set<string>([asset]);

      if (asset === "HIVE") {
        assetsToRefresh.add("HP");
        assetsToRefresh.add("HIVE");
      }
      if (asset === "HBD") {
        assetsToRefresh.add("HBD");
      }

      if (asset === "LARYNX" && operation === AssetOperation.PowerUp) {
        assetsToRefresh.add("LP");
        assetsToRefresh.add("LARYNX");
      }

      assetsToRefresh.forEach((symbol) => {
        const query = getAccountWalletAssetInfoQueryOptions(username, symbol, {
          refetch: true,
        });

        // Give some time to blockchain
        setTimeout(
          () =>
            getQueryClient().invalidateQueries({
              queryKey: query.queryKey,
            }),
          5000
        );
      });
    },
  });
}
