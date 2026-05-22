import { useBroadcastMutation, invalidateAfterBroadcast } from "@/modules/core/mutations";
import type { BroadcastMode } from "@/modules/core/mutations";
import { QueryKeys } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildTransferToVestingOp } from "@/modules/operations/builders";

export interface TransferToVestingPayload {
  to: string;
  amount: string;
}

export function useTransferToVesting(
  username: string | undefined,
  auth?: AuthContextV2,
  broadcastMode?: BroadcastMode
) {
  return useBroadcastMutation<TransferToVestingPayload>(
    ["wallet", "transfer-to-vesting"],
    username,
    (payload) => [
      buildTransferToVestingOp(username!, payload.to, payload.amount)
    ],
    async (_result, variables) => {
      await invalidateAfterBroadcast(auth?.adapter, broadcastMode, [
        QueryKeys.accounts.full(username),
        QueryKeys.accounts.full(variables.to),
        ["ecency-wallets", "asset-info", username],
        ["wallet", "portfolio", "v2", username]
      ]);
    },
    auth,
    'active',
    { broadcastMode }
  );
}
