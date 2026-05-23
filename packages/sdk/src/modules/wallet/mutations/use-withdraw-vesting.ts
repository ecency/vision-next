import { useBroadcastMutation, invalidateAfterBroadcast } from "@/modules/core/mutations";
import type { BroadcastMode } from "@/modules/core/mutations";
import { QueryKeys } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildWithdrawVestingOp } from "@/modules/operations/builders";

export interface WithdrawVestingPayload {
  vestingShares: string;
}

export function useWithdrawVesting(
  username: string | undefined,
  auth?: AuthContextV2,
  broadcastMode?: BroadcastMode
) {
  return useBroadcastMutation<WithdrawVestingPayload>(
    ["wallet", "withdraw-vesting"],
    username,
    (payload) => [
      buildWithdrawVestingOp(username!, payload.vestingShares)
    ],
    async () => {
      await invalidateAfterBroadcast(auth?.adapter, broadcastMode, [
        QueryKeys.accounts.full(username),
        ["ecency-wallets", "asset-info", username],
        ["wallet", "portfolio", "v2", username]
      ]);
    },
    auth,
    'active',
    { broadcastMode }
  );
}
