import { useBroadcastMutation } from "@/modules/core/mutations";
import { QueryKeys } from "@/modules/core";
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
          QueryKeys.accounts.full(username),
          QueryKeys.accounts.full(variables.to),
          ["ecency-wallets", "asset-info", username],
          ["wallet", "portfolio", "v2", username]
        ]);
      }
    },
    auth,
    'active'
  );
}
