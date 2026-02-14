import { useBroadcastMutation } from "@/modules/core/mutations";
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
          ["wallet", "balances", username],
          ["wallet", "transactions", username]
        ]);
      }
    },
    auth,
    'active'
  );
}
