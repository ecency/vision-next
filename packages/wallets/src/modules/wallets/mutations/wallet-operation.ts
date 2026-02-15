import {
  AssetOperation,
  getHiveEngineTokensBalancesQueryOptions,
  HiveEngineTokenBalance,
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

// Build a SPK custom_json operation
function buildSpkCustomJsonOp(
  from: string,
  id: string,
  amount: number
): Operation {
  return ["custom_json", {
    id,
    required_auths: [from],
    required_posting_auths: [],
    json: JSON.stringify({ amount: amount * 1000 }),
  }];
}

// Build a Hive Engine custom_json operation
function buildEngineOp(
  from: string,
  contractAction: string,
  contractPayload: Record<string, string>,
  contractName = "tokens"
): Operation {
  return ["custom_json", {
    id: "ssc-mainnet-hive",
    required_auths: [from],
    required_posting_auths: [],
    json: JSON.stringify({ contractName, contractAction, contractPayload }),
  }];
}

// Build a scot_claim_token operation (posting authority)
function buildEngineClaimOp(
  account: string,
  tokens: string[]
): Operation {
  return ["custom_json", {
    id: "scot_claim_token",
    required_auths: [],
    required_posting_auths: [account],
    json: JSON.stringify(tokens.map((symbol) => ({ symbol }))),
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
        return [["custom_json", {
          id: "spkcc_spk_send",
          required_auths: [from],
          required_posting_auths: [],
          json: JSON.stringify({ to, amount: numAmount, token: "SPK" }),
        }]];
      }
      break;

    case "LARYNX":
      switch (operation) {
        case AssetOperation.Transfer: {
          const numAmount = typeof amount === "number" ? amount : parseFloat(amount) * 1000;
          return [["custom_json", {
            id: "spkcc_send",
            required_auths: [from],
            required_posting_auths: [],
            json: JSON.stringify({ to, amount: numAmount }),
          }]];
        }
        case AssetOperation.LockLiquidity: {
          const parsedAmount = typeof payload.amount === "string"
            ? parseFloat(payload.amount)
            : payload.amount;
          const id = payload.mode === "lock" ? "spkcc_gov_up" : "spkcc_gov_down";
          return [buildSpkCustomJsonOp(from, id, parsedAmount)];
        }
        case AssetOperation.PowerUp: {
          const parsedAmount = typeof payload.amount === "string"
            ? parseFloat(payload.amount)
            : payload.amount;
          const id = `spkcc_power_${payload.mode ?? "up"}`;
          return [buildSpkCustomJsonOp(from, id, parsedAmount)];
        }
      }
      break;
  }

  return null;
}

// Build engine token operations
function buildEngineOperation(
  asset: string,
  operation: AssetOperation,
  payload: Record<string, any>
): Operation[] | null {
  const { from, to, amount } = payload;
  // Parse amount if it's a string like "100.000 TOKEN"
  const quantity = typeof amount === "string" && amount.includes(" ")
    ? amount.split(" ")[0]
    : String(amount);

  switch (operation) {
    case AssetOperation.Transfer:
      return [buildEngineOp(from, "transfer", {
        symbol: asset, to, quantity, memo: payload.memo ?? ""
      })];
    case AssetOperation.Stake:
      return [buildEngineOp(from, "stake", { symbol: asset, to, quantity })];
    case AssetOperation.Unstake:
      return [buildEngineOp(from, "unstake", { symbol: asset, to, quantity })];
    case AssetOperation.Delegate:
      return [buildEngineOp(from, "delegate", { symbol: asset, to, quantity })];
    case AssetOperation.Undelegate:
      return [buildEngineOp(from, "undelegate", { symbol: asset, from: to, quantity })];
    case AssetOperation.Claim:
      return [buildEngineClaimOp(from, [asset])];
  }

  return null;
}

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
      // Try to build operations using SDK builders (native Hive + SPK + LARYNX)
      const ops = buildHiveOperation(asset, operation, payload);
      if (ops) {
        return broadcastActiveOperation(
          payload as any,
          ops,
          auth
        );
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
        const engineOps = buildEngineOperation(asset, operation, payload);
        if (engineOps) {
          // Engine claim uses posting authority — handle separately
          if (operation === AssetOperation.Claim) {
            return broadcastActiveOperation(
              payload as any,
              engineOps,
              auth
            );
          }
          return broadcastActiveOperation(
            payload as any,
            engineOps,
            auth
          );
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
