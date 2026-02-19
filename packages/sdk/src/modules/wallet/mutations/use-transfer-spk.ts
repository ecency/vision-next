import { useBroadcastMutation } from "@/modules/core/mutations";
import { QueryKeys } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import type { Operation } from "@hiveio/dhive";

export interface TransferSpkPayload {
  to: string;
  amount: number;
  memo?: string;
}

export function useTransferSpk(username: string | undefined, auth?: AuthContextV2) {
  return useBroadcastMutation<TransferSpkPayload>(
    ["wallet", "transfer-spk"],
    username,
    (payload) => {
      const json = JSON.stringify({
        to: payload.to,
        amount: payload.amount,
        ...(typeof payload.memo === "string" ? { memo: payload.memo } : {}),
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
          QueryKeys.accounts.full(username),
          QueryKeys.accounts.full(variables.to),
          ["ecency-wallets", "asset-info", username],
          ["wallet", "portfolio", "v2", username]
        ]);
      }
    },
    auth,
    'active'
  );
}
