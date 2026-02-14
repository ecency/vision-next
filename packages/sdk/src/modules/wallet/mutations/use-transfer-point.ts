import { useBroadcastMutation } from "@/modules/core/mutations";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildPointTransferOp } from "@/modules/operations/builders";

export interface TransferPointPayload {
  to: string;
  amount: string;
  memo: string;
}

/**
 * React Query mutation hook for transferring Ecency points.
 *
 * Uses `ecency_point_transfer` custom_json operation with ACTIVE authority.
 */
export function useTransferPoint(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<TransferPointPayload>(
    ["wallet", "transfer-point"],
    username,
    (payload) => [
      buildPointTransferOp(username!, payload.to, payload.amount, payload.memo)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "balances", variables.to],
          ["wallet", "transactions", username]
        ]);
      }
    },
    auth,
    'active'
  );
}
