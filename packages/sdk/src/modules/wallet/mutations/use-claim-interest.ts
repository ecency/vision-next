import { useBroadcastMutation } from "@/modules/core/mutations";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildClaimInterestOps } from "@/modules/operations/builders";

export interface ClaimInterestPayload {
  to: string;
  amount: string;
  memo: string;
  requestId: number;
}

export function useClaimInterest(username: string | undefined, auth?: AuthContextV2) {
  return useBroadcastMutation<ClaimInterestPayload>(
    ["wallet", "claim-interest"],
    username,
    (payload) => buildClaimInterestOps(username!, payload.to, payload.amount, payload.memo, payload.requestId),
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
