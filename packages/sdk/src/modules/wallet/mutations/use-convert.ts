import { useBroadcastMutation } from "@/modules/core/mutations";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildConvertOp, buildCollateralizedConvertOp } from "@/modules/operations/builders";

export interface ConvertPayload {
  amount: string;
  requestId: number;
  collateralized?: boolean;
}

export function useConvert(username: string | undefined, auth?: AuthContextV2) {
  return useBroadcastMutation<ConvertPayload>(
    ["wallet", "convert"],
    username,
    (payload) => [
      payload.collateralized
        ? buildCollateralizedConvertOp(username!, payload.amount, payload.requestId)
        : buildConvertOp(username!, payload.amount, payload.requestId)
    ],
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
