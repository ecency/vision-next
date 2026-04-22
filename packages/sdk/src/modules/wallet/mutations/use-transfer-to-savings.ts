import { useBroadcastMutation } from "@/modules/core/mutations";
import type { BroadcastMode } from "@/modules/core/mutations";
import { QueryKeys } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildTransferToSavingsOp } from "@/modules/operations/builders";

export interface TransferToSavingsPayload {
  to: string;
  amount: string;
  memo: string;
}

export function useTransferToSavings(
  username: string | undefined,
  auth?: AuthContextV2,
  broadcastMode?: BroadcastMode
) {
  return useBroadcastMutation<TransferToSavingsPayload>(
    ["wallet", "transfer-to-savings"],
    username,
    (payload) => [
      buildTransferToSavingsOp(username!, payload.to, payload.amount, payload.memo)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        const keys = [
          QueryKeys.accounts.full(username),
          QueryKeys.accounts.full(variables.to),
          ["ecency-wallets", "asset-info", username],
          ["wallet", "portfolio", "v2", username]
        ];
        if (broadcastMode === 'async') {
          setTimeout(() => auth.adapter!.invalidateQueries!(keys), 4000);
        } else {
          await auth.adapter.invalidateQueries(keys);
        }
      }
    },
    auth,
    'active',
    { broadcastMode }
  );
}
