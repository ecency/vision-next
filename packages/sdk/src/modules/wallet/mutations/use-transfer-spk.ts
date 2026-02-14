import { useBroadcastMutation } from "@/modules/core/mutations";
import type { AuthContextV2 } from "@/modules/core/types";
import type { Operation } from "@hiveio/dhive";

export interface TransferSpkPayload {
  to: string;
  amount: number;
}

export function useTransferSpk(username: string | undefined, auth?: AuthContextV2) {
  return useBroadcastMutation<TransferSpkPayload>(
    ["wallet", "transfer-spk"],
    username,
    (payload) => {
      const json = JSON.stringify({
        to: payload.to,
        amount: payload.amount,
        token: "SPK"
      });
      return [["custom_json", {
        required_auths: [username!],
        required_posting_auths: [],
        id: "spkcc_spk_send",
        json,
      }] as Operation];
    },
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
