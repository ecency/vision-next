import { useBroadcastMutation } from "@/modules/core/mutations";
import { QueryKeys } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildTransferFromSavingsOp } from "@/modules/operations/builders";

export interface TransferFromSavingsPayload {
  to: string;
  amount: string;
  memo: string;
  requestId: number;
}

export function useTransferFromSavings(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<TransferFromSavingsPayload>(
    ["wallet", "transfer-from-savings"],
    username,
    (payload) => [
      buildTransferFromSavingsOp(username!, payload.to, payload.amount, payload.memo, payload.requestId)
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
