import { useBroadcastMutation } from "@/modules/core/mutations";
import type { AuthContextV2 } from "@/modules/core/types";
import type { Operation } from "@hiveio/dhive";

export interface TransferLarynxPayload {
  to: string;
  amount: number;
  token?: string;
}

export function useTransferLarynx(username: string | undefined, auth?: AuthContextV2) {
  return useBroadcastMutation<TransferLarynxPayload>(
    ["wallet", "transfer-larynx"],
    username,
    (payload) => {
      const json = JSON.stringify({
        to: payload.to,
        amount: payload.amount,
        token: payload.token ?? "LARYNX"
      });
      return [["custom_json", {
        required_auths: [username!],
        required_posting_auths: [],
        id: "spkcc_send",
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
