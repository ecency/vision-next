import { useBroadcastMutation } from "@/modules/core/mutations";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildTransferToVestingOp } from "@/modules/operations/builders";

export interface TransferToVestingPayload {
  to: string;
  amount: string;
}

export function useTransferToVesting(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<TransferToVestingPayload>(
    ["wallet", "transfer-to-vesting"],
    username,
    (payload) => [
      buildTransferToVestingOp(username!, payload.to, payload.amount)
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
