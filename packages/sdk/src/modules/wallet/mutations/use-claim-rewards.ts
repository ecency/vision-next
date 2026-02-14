import { useBroadcastMutation } from "@/modules/core/mutations";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildClaimRewardBalanceOp } from "@/modules/operations/builders";

export interface ClaimRewardsPayload {
  rewardHive: string;
  rewardHbd: string;
  rewardVests: string;
}

export function useClaimRewards(username: string | undefined, auth?: AuthContextV2) {
  return useBroadcastMutation<ClaimRewardsPayload>(
    ["wallet", "claim-rewards"],
    username,
    (payload) => [
      buildClaimRewardBalanceOp(username!, payload.rewardHive, payload.rewardHbd, payload.rewardVests)
    ],
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["get-account-full", username],
          ["wallet", "balances", username],
        ]);
      }
    },
    auth,
    'posting'
  );
}
