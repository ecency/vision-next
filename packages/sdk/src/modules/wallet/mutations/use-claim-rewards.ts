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
const pendingInvalidationTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function useClaimRewards(username: string | undefined, auth?: AuthContextV2) {
  return useBroadcastMutation<ClaimRewardsPayload>(
    ["wallet", "claim-rewards"],
    username,
    (payload) => [
      buildClaimRewardBalanceOp(username!, payload.rewardHive, payload.rewardHbd, payload.rewardVests)
    ],
    () => {
      const timerKey = username ?? "__anonymous__";
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
      const existingTimer = pendingInvalidationTimers.get(timerKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
        pendingInvalidationTimers.delete(timerKey);
      }

      const timer = setTimeout(async () => {
        try {
          const qc = getQueryClient();
          const results = await Promise.allSettled(
            keysToInvalidate.map((key) => qc.invalidateQueries({ queryKey: key }))
          );
          const rejected = results.filter((result) => result.status === "rejected");
          if (rejected.length > 0) {
            console.error("[SDK][Wallet][useClaimRewards] delayed invalidation rejected", {
              username,
              rejectedCount: rejected.length,
              rejected
            });
          }
        } catch (error) {
          console.error("[SDK][Wallet][useClaimRewards] delayed invalidation failed", {
            username,
            error
          });
        } finally {
          pendingInvalidationTimers.delete(timerKey);
        }
      }, CLAIM_REWARDS_INVALIDATION_DELAY_MS);

      pendingInvalidationTimers.set(timerKey, timer);
    },
    auth,
    'posting'
  );
}
