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
  undelegateEngineToken,
  unstakeEngineToken,
  withdrawVestingRouteHive,
  powerUpLarynx,
} from "@/modules/assets";
import { EcencyAnalytics, getQueryClient } from "@ecency/sdk";
import { useMutation } from "@tanstack/react-query";
import { getAccountWalletAssetInfoQueryOptions } from "../queries";

const operationToFunctionMap: Record<
  string,
  Partial<Record<AssetOperation, any>>
> = {
  HIVE: {
    [AssetOperation.Transfer]: transferHive,
    [AssetOperation.TransferToSavings]: transferToSavingsHive,
    [AssetOperation.PowerUp]: powerUpHive,
  },
  HBD: {
    [AssetOperation.Transfer]: transferHive,
    [AssetOperation.TransferToSavings]: transferToSavingsHive,
  },
  HP: {
    [AssetOperation.PowerDown]: powerDownHive,
    [AssetOperation.Delegate]: delegateHive,
    [AssetOperation.WithdrawRoutes]: withdrawVestingRouteHive,
  },
  POINTS: {
    [AssetOperation.Gift]: transferPoint,
  },
  SPK: {
    [AssetOperation.Transfer]: transferSpk,
  },
  LARYNX: {
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
  operation: AssetOperation
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
        return operationFn(payload);
      }

      // Handle Hive engine ops
      const balancesListQuery =
        getHiveEngineTokensBalancesQueryOptions(username);
      await getQueryClient().prefetchQuery(balancesListQuery);
      const balances = getQueryClient().getQueryData<HiveEngineTokenBalance[]>(
        balancesListQuery.queryKey
      );

      if (balances?.some((b) => b.symbol === asset)) {
        const operationFn = engineOperationToFunctionMap[operation];
        if (operationFn) {
          return operationFn({ ...payload, asset });
        }
      }

      throw new Error("[SDK][Wallets] – no operation for given asset");
    },
    onSuccess: () => {
      recordActivity();

      const query = getAccountWalletAssetInfoQueryOptions(username, asset, {
        refetch: true,
      });

      // Give a some time to blockchain
      setTimeout(
        () =>
          getQueryClient().invalidateQueries({
            queryKey: query.queryKey,
          }),
        5000
      );
    },
  });
}
