import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import type { BroadcastMode } from "@/modules/core";
import { buildRcDelegationOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

export interface RcDelegationPayload {
  duration: number;
}

/**
 * Buys a short-term, RC-only delegation (RC top-up) for the active user, paid
 * with Ecency Points. Mirrors {@link useBoostPlus} but is RC-only (no Hive
 * Power / voting power transferred). Invalidates the user's account + RC caches
 * so the new RC shows up once the relay delegation lands.
 */
export function useRcDelegation(
  username: string | undefined,
  auth?: AuthContextV2,
  broadcastMode?: BroadcastMode
) {
  return useBroadcastMutation<RcDelegationPayload>(
    ["promotions", "rc-delegation"],
    username,
    ({ duration }) => [buildRcDelegationOp(username!, duration)],
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.accounts.full(username),
          QueryKeys.resourceCredits.account(username!),
          ["promotions", "rc-delegation-active", username]
        ]);
      }
    },
    auth,
    "active",
    { broadcastMode }
  );
}
