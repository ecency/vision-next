import { useBroadcastMutation, invalidateAfterBroadcast } from "@/modules/core/mutations";
import type { BroadcastMode } from "@/modules/core/mutations";
import { QueryKeys } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildClaimInterestOps } from "@/modules/operations/builders";

export interface ClaimInterestPayload {
  to: string;
  amount: string;
  memo: string;
  requestId: number;
}

export function useClaimInterest(username: string | undefined, auth?: AuthContextV2,
  broadcastMode?: BroadcastMode
) {
  return useBroadcastMutation<ClaimInterestPayload>(
    ["wallet", "claim-interest"],
    username,
    (payload) => buildClaimInterestOps(username!, payload.to, payload.amount, payload.memo, payload.requestId),
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
