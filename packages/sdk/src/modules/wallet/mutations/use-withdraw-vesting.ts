import { useBroadcastMutation } from "@/modules/core/mutations";
import { QueryKeys } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildWithdrawVestingOp } from "@/modules/operations/builders";

export interface WithdrawVestingPayload {
  vestingShares: string;
}

export function useWithdrawVesting(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<WithdrawVestingPayload>(
    ["wallet", "withdraw-vesting"],
    username,
    (payload) => [
      buildWithdrawVestingOp(username!, payload.vestingShares)
    ],
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.accounts.full(username),
          ["ecency-wallets", "asset-info", username],
          ["wallet", "portfolio", "v2", username]
        ]);
      }
    },
    auth,
    'active'
  );
}
