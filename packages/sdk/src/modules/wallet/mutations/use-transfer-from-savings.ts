import { useBroadcastMutation } from "@/modules/core/mutations";
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
          ["wallet", "balances", username],
          ["wallet", "balances", variables.to],
          ["wallet", "transactions", username],
          ["wallet", "savings-withdrawals", username]
        ]);
      }
    },
    auth,
    'active'
  );
}
