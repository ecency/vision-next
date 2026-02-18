"use client";

import { UseQueryResult } from "@tanstack/react-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hpToVests } from "@/features/shared/transfer/hp-to-vests";
import { TransferAsset, TransferMode } from "@/features/shared";
import { DEFAULT_DYNAMIC_PROPS } from "@/consts/default-dynamic-props";
import { getDynamicPropsQueryOptions } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { invalidateWalletQueries } from "@/features/wallet/utils/invalidate-wallet-queries";
import {
  useTransferMutation,
  useTransferPointMutation,
  useTransferToSavingsMutation,
  useTransferFromSavingsMutation,
  useTransferToVestingMutation,
  useWithdrawVestingMutation,
  useConvertMutation,
  useClaimInterestMutation,
  useDelegateVestingSharesMutation,
  useTransferSpkMutation,
  useTransferLarynxMutation,
  useTransferEngineTokenMutation,
} from "@/api/sdk-mutations";

// Helper to safely read hivePerMVests with a typed fallback
const useHivePerMVests = () => {
  const { data } = useQuery(getDynamicPropsQueryOptions()) as UseQueryResult<
    typeof DEFAULT_DYNAMIC_PROPS,
    Error
  >;
  return (data ?? DEFAULT_DYNAMIC_PROPS).hivePerMVests;
};

export interface SignTransferPayload {
  to: string;
  amount: string;
  memo: string;
}

/**
 * Unified sign-transfer hook.
 *
 * Dispatches to the appropriate SDK mutation based on `mode` and `asset`.
 * Auth is handled entirely by the SDK adapter (showAuthUpgradeUI for web,
 * stored keys for mobile). No more KeyOrHot — single "Sign" button.
 */
export function useSignTransfer(mode: TransferMode, asset: TransferAsset) {
  const { activeUser } = useActiveAccount();
  const hivePerMVests = useHivePerMVests();
  const queryClient = useQueryClient();

  // All SDK mutation hooks (lightweight — just useMutation wrappers)
  const transfer = useTransferMutation();
  const transferPoint = useTransferPointMutation();
  const toSavings = useTransferToSavingsMutation();
  const fromSavings = useTransferFromSavingsMutation();
  const toVesting = useTransferToVestingMutation();
  const withdrawVesting = useWithdrawVestingMutation();
  const convert = useConvertMutation();
  const claimInterest = useClaimInterestMutation();
  const delegate = useDelegateVestingSharesMutation();
  const transferSpk = useTransferSpkMutation();
  const transferLarynx = useTransferLarynxMutation();
  const transferEngine = useTransferEngineTokenMutation();

  const isPending =
    transfer.isPending ||
    transferPoint.isPending ||
    toSavings.isPending ||
    fromSavings.isPending ||
    toVesting.isPending ||
    withdrawVesting.isPending ||
    convert.isPending ||
    claimInterest.isPending ||
    delegate.isPending ||
    transferSpk.isPending ||
    transferLarynx.isPending ||
    transferEngine.isPending;

  return {
    isPending,
    mutateAsync: async ({ to, amount, memo }: SignTransferPayload) => {
      const fullAmount = `${(+amount).toFixed(3)} ${asset}`;
      const requestId = Date.now() >>> 0;

      switch (mode) {
        case "transfer":
          if (asset === "POINT") {
            await transferPoint.mutateAsync({ to, amount: fullAmount, memo });
          } else if (asset === "SPK") {
            await transferSpk.mutateAsync({ to, amount: parseFloat(amount) * 1000 });
          } else if (asset === "LARYNX") {
            await transferLarynx.mutateAsync({ to, amount: parseFloat(amount) * 1000 });
          } else if (asset !== "HIVE" && asset !== "HBD") {
            // Hive Engine token
            await transferEngine.mutateAsync({ to, quantity: amount, symbol: asset, memo });
          } else {
            await transfer.mutateAsync({ to, amount: fullAmount, memo });
          }
          break;

        case "transfer-saving":
          await toSavings.mutateAsync({ to, amount: fullAmount, memo });
          break;

        case "withdraw-saving":
          await fromSavings.mutateAsync({ to, amount: fullAmount, memo, requestId });
          break;

        case "convert":
          await convert.mutateAsync({
            amount: fullAmount,
            requestId,
            collateralized: asset === "HIVE",
          });
          break;

        case "claim-interest":
          await claimInterest.mutateAsync({ to, amount: fullAmount, memo, requestId });
          break;

        case "power-up":
          await toVesting.mutateAsync({ to, amount: fullAmount });
          break;

        case "power-down": {
          const vests = hpToVests(Number(amount), hivePerMVests);
          await withdrawVesting.mutateAsync({ vestingShares: vests });
          break;
        }

        case "delegate": {
          const vests = hpToVests(Number(amount), hivePerMVests);
          await delegate.mutateAsync({ delegatee: to, vestingShares: vests });
          break;
        }
      }

      // Invalidate wallet caches after successful transaction
      invalidateWalletQueries(queryClient, activeUser?.username);
    },
  };
}
