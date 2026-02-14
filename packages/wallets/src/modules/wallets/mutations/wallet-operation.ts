import {
  AssetOperation,
  claimHiveEngineRewards,
  delegateEngineToken,
  getHiveEngineTokensBalancesQueryOptions,
  HiveEngineTokenBalance,
  lockLarynx,
  stakeEngineToken,
  transferEngineToken,
  undelegateEngineToken,
  unstakeEngineToken,
  powerUpLarynx,
} from "@/modules/assets";
import {
  EcencyAnalytics,
  getQueryClient,
  buildTransferOp,
  buildTransferToSavingsOp,
  buildTransferFromSavingsOp,
  buildTransferToVestingOp,
  buildWithdrawVestingOp,
  buildDelegateVestingSharesOp,
  buildSetWithdrawVestingRouteOp,
  buildConvertOp,
  buildClaimInterestOps,
  buildPointTransferOp,
} from "@ecency/sdk";
import type { AuthContext } from "@ecency/sdk";
import type { Operation } from "@hiveio/dhive";
import { useMutation } from "@tanstack/react-query";
import { getAccountWalletAssetInfoQueryOptions } from "../queries";
import { broadcastActiveOperation } from "@/modules/assets/utils/broadcast-active-operation";

// SPK/LARYNX transfer operation builders
function buildSpkTransferOp(from: string, to: string, amount: number): Operation {
  return ["custom_json", {
    id: "spkcc_spk_send",
    required_auths: [from],
    required_posting_auths: [],
    json: JSON.stringify({ to, amount, token: "SPK" }),
  }];
}

function buildLarynxTransferOp(from: string, to: string, amount: number): Operation {
  return ["custom_json", {
    id: "spkcc_send",
    required_auths: [from],
    required_posting_auths: [],
    json: JSON.stringify({ to, amount }),
  }];
}

// Build operations for known asset/operation combinations using SDK builders
function buildHiveOperation(
  asset: string,
  operation: AssetOperation,
  payload: Record<string, any>
): Operation[] | null {
  const { from, to, amount, memo } = payload;
  const requestId = Date.now() >>> 0;

  switch (asset) {
    case "HIVE":
      switch (operation) {
        case AssetOperation.Transfer:
          return [buildTransferOp(from, to, amount, memo)];
        case AssetOperation.TransferToSavings:
          return [buildTransferToSavingsOp(from, to, amount, memo)];
        case AssetOperation.WithdrawFromSavings:
          return [buildTransferFromSavingsOp(from, to, amount, memo, payload.request_id ?? requestId)];
        case AssetOperation.PowerUp:
          return [buildTransferToVestingOp(from, to, amount)];
      }
      break;

    case "HBD":
      switch (operation) {
        case AssetOperation.Transfer:
          return [buildTransferOp(from, to, amount, memo)];
        case AssetOperation.TransferToSavings:
          return [buildTransferToSavingsOp(from, to, amount, memo)];
        case AssetOperation.WithdrawFromSavings:
          return [buildTransferFromSavingsOp(from, to, amount, memo, payload.request_id ?? requestId)];
        case AssetOperation.ClaimInterest:
          return buildClaimInterestOps(from, to, amount, memo, payload.request_id ?? requestId);
        case AssetOperation.Convert:
          return [buildConvertOp(from, amount, Math.floor(Date.now() / 1000))];
      }
      break;

    case "HP":
      switch (operation) {
        case AssetOperation.PowerDown:
          return [buildWithdrawVestingOp(from, amount)];
        case AssetOperation.Delegate:
          return [buildDelegateVestingSharesOp(from, to, amount)];
        case AssetOperation.WithdrawRoutes:
          return [buildSetWithdrawVestingRouteOp(
            payload.from_account ?? from,
            payload.to_account ?? to,
            payload.percent ?? 0,
            payload.auto_vest ?? false
          )];
      }
      break;

    case "POINTS":
      if (operation === AssetOperation.Transfer || operation === AssetOperation.Gift) {
        return [buildPointTransferOp(from, to, amount, memo)];
      }
      break;

    case "SPK":
      if (operation === AssetOperation.Transfer) {
        const numAmount = typeof amount === "number" ? amount : parseFloat(amount) * 1000;
        return [buildSpkTransferOp(from, to, numAmount)];
      }
      break;

    case "LARYNX":
      switch (operation) {
        case AssetOperation.Transfer: {
          const numAmount = typeof amount === "number" ? amount : parseFloat(amount) * 1000;
          return [buildLarynxTransferOp(from, to, numAmount)];
        }
        case AssetOperation.LockLiquidity:
          return null; // Handled by lockLarynx function
        case AssetOperation.PowerUp:
          return null; // Handled by powerUpLarynx function
      }
      break;
  }

  return null;
}

// Non-SDK operations that stay in wallets package
const specialOperationMap: Record<
  string,
  Partial<Record<AssetOperation, any>>
> = {
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
  [AssetOperation.Claim]: (payload: any, auth?: any) => {
    return claimHiveEngineRewards(
      {
        account: payload.from,
        tokens: [payload.asset],
        type: payload.type,
        ...(payload.type === "key" && payload.key ? { key: payload.key } : {}),
      },
      auth
    );
  },
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
      // Try to build operations using SDK builders
      const ops = buildHiveOperation(asset, operation, payload);
      if (ops) {
        return broadcastActiveOperation(
          payload as any,
          ops,
          auth
        );
      }

      // Check special (non-SDK) operations
      const specialFn = specialOperationMap[asset]?.[operation];
      if (specialFn) {
        return specialFn(payload, auth);
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

        setTimeout(
          () =>
            getQueryClient().invalidateQueries({
              queryKey: query.queryKey,
            }),
          5000
        );
      });

      setTimeout(
        () =>
          getQueryClient().invalidateQueries({
            queryKey: ["ecency-wallets", "portfolio", "v2", username],
          }),
        4000
      );
    },
  });
}
