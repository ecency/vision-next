import { useBroadcastMutation } from "@/modules/core/mutations";
import type { AuthContextV2 } from "@/modules/core/types";
import type { Operation } from "@hiveio/dhive";

export interface StakeEngineTokenPayload {
  to: string;
  symbol: string;
  quantity: string;
}

export function useStakeEngineToken(username: string | undefined, auth?: AuthContextV2) {
  return useBroadcastMutation<StakeEngineTokenPayload>(
    ["wallet", "stake-engine-token"],
    username,
    (payload) => {
      const json = JSON.stringify({
        contractName: "tokens",
        contractAction: "stake",
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
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "balances", variables.to],
        ]);
      }
    },
    auth,
    'active'
  );
}
