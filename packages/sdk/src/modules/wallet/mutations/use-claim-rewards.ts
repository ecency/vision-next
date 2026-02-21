import { useBroadcastMutation } from "@/modules/core/mutations";
import { QueryKeys, getQueryClient } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildClaimRewardBalanceOp } from "@/modules/operations/builders";

export interface ClaimRewardsPayload {
  rewardHive: string;
  rewardHbd: string;
  rewardVests: string;
}

const CLAIM_REWARDS_INVALIDATION_DELAY_MS = 5000;
let pendingInvalidationTimer: ReturnType<typeof setTimeout> | null = null;

export function useClaimRewards(username: string | undefined, auth?: AuthContextV2) {
  return useBroadcastMutation<ClaimRewardsPayload>(
    ["wallet", "claim-rewards"],
    username,
    (payload) => [
      buildClaimRewardBalanceOp(username!, payload.rewardHive, payload.rewardHbd, payload.rewardVests)
    ],
    () => {
      const keysToInvalidate = [
        QueryKeys.accounts.full(username),
        ["ecency-wallets", "asset-info", username],
        ["wallet", "portfolio", "v2", username],
        QueryKeys.assets.hiveGeneralInfo(username!),
        QueryKeys.assets.hbdGeneralInfo(username!),
        QueryKeys.assets.hivePowerGeneralInfo(username!),
      ];

      // Delay invalidation to allow blockchain to propagate the transaction.
      // Immediate invalidation would fetch stale (pre-confirmation) data.
      if (pendingInvalidationTimer) {
        clearTimeout(pendingInvalidationTimer);
      }

      pendingInvalidationTimer = setTimeout(() => {
        const qc = getQueryClient();
        keysToInvalidate.forEach((key) => {
          qc.invalidateQueries({ queryKey: key });
        });
        pendingInvalidationTimer = null;
      }, CLAIM_REWARDS_INVALIDATION_DELAY_MS);
    },
    auth,
    'posting'
  );
}
