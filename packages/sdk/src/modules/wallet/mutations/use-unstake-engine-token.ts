import { useBroadcastMutation } from "@/modules/core/mutations";
import type { AuthContextV2 } from "@/modules/core/types";
import type { Operation } from "@hiveio/dhive";

export interface UnstakeEngineTokenPayload {
  to: string;
  symbol: string;
  quantity: string;
}

export function useUnstakeEngineToken(username: string | undefined, auth?: AuthContextV2) {
  return useBroadcastMutation<UnstakeEngineTokenPayload>(
    ["wallet", "unstake-engine-token"],
    username,
    (payload) => {
      const json = JSON.stringify({
        contractName: "tokens",
        contractAction: "unstake",
        contractPayload: {
          symbol: payload.symbol,
          to: payload.to,
          quantity: payload.quantity,
        }
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
          ["wallet", "balances", username],
        ]);
      }
    },
    auth,
    'active'
  );
}
