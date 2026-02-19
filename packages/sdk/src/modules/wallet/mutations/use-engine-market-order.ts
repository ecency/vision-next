import { useBroadcastMutation } from "@/modules/core/mutations";
import { QueryKeys } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import type { Operation } from "@hiveio/dhive";

export interface EngineMarketOrderPayload {
  action: "buy" | "sell" | "cancel";
  symbol: string;
  quantity?: string;
  price?: string;
  orderId?: string;
  orderType?: "buy" | "sell";
}

export function useEngineMarketOrder(username: string | undefined, auth?: AuthContextV2) {
  return useBroadcastMutation<EngineMarketOrderPayload>(
    ["wallet", "engine-market-order"],
    username,
    (payload) => {
      let contractPayload: Record<string, string>;
      let contractAction: string;

      if (payload.action === "cancel") {
        contractAction = "cancel";
        contractPayload = {
          type: payload.orderType!,
          id: payload.orderId!,
        };
      } else {
        contractAction = payload.action;
        contractPayload = {
          symbol: payload.symbol,
          quantity: payload.quantity!,
          price: payload.price!,
        };
      }

      const json = JSON.stringify({
        contractName: "market",
        contractAction,
        contractPayload,
      });
      return [["custom_json", {
        id: "ssc-mainnet-hive",
        required_auths: [username!],
        required_posting_auths: [],
        json,
      }] as Operation];
    },
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.accounts.full(username),
          ["ecency-wallets", "asset-info", username],
          ["wallet", "portfolio", "v2", username]
        ]);
      }
    },
    auth,
    'active'
  );
}
