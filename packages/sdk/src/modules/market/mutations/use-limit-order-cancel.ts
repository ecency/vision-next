import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildLimitOrderCancelOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

export interface LimitOrderCancelPayload {
  orderId: number;
}

export function useLimitOrderCancel(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<LimitOrderCancelPayload>(
    ["market", "limit-order-cancel"],
    username,
    ({ orderId }) => [
      buildLimitOrderCancelOp(username!, orderId)
    ],
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.accounts.full(username),
          QueryKeys.wallet.openOrders(username!),
          ["ecency-wallets", "asset-info", username],
          ["wallet", "portfolio", "v2", username],
        ]);
      }
    },
    auth,
    'active'
  );
}
