import { useBroadcastMutation } from "@/modules/core/mutations";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildTransferToSavingsOp } from "@/modules/operations/builders";

export interface TransferToSavingsPayload {
  to: string;
  amount: string;
  memo: string;
}

export function useTransferToSavings(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<TransferToSavingsPayload>(
    ["wallet", "transfer-to-savings"],
    username,
    (payload) => [
      buildTransferToSavingsOp(username!, payload.to, payload.amount, payload.memo)
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
