import { useBroadcastMutation } from "@/modules/core/mutations";
import type { AuthContextV2 } from "@/modules/core/types";
import type { Operation } from "@hiveio/dhive";

export interface LockLarynxPayload {
  mode: "lock" | "unlock";
  amount: number;
}

export function useLockLarynx(username: string | undefined, auth?: AuthContextV2) {
  return useBroadcastMutation<LockLarynxPayload>(
    ["wallet", "lock-larynx"],
    username,
    (payload) => {
      const json = JSON.stringify({ amount: payload.amount * 1000 });
      return [["custom_json", {
        id: payload.mode === "lock" ? "spkcc_gov_up" : "spkcc_gov_down",
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
