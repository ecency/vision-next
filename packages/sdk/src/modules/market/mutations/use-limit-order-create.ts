import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildLimitOrderCreateOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

export interface LimitOrderCreatePayload {
  amountToSell: string;
  minToReceive: string;
  fillOrKill: boolean;
  expiration: string;
  orderId: number;
}

export function useLimitOrderCreate(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<LimitOrderCreatePayload>(
    ["market", "limit-order-create"],
    username,
    (payload) => [
      buildLimitOrderCreateOp(
        username!,
        payload.amountToSell,
        payload.minToReceive,
        payload.fillOrKill,
        payload.expiration,
        payload.orderId
      )
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
