import { useBroadcastMutation } from "@/modules/core/mutations";
import type { AuthContextV2 } from "@/modules/core/types";
import type { Operation } from "@hiveio/dhive";

export interface ClaimEngineRewardsPayload {
  tokens: string[];
}

export function useClaimEngineRewards(username: string | undefined, auth?: AuthContextV2) {
  return useBroadcastMutation<ClaimEngineRewardsPayload>(
    ["wallet", "claim-engine-rewards"],
    username,
    (payload) => {
      const json = JSON.stringify(payload.tokens.map((symbol) => ({ symbol })));
      return [["custom_json", {
        id: "scot_claim_token",
        required_auths: [],
        required_posting_auths: [username!],
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
    'posting'
  );
}
