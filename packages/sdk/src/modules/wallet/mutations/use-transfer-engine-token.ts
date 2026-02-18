import { useBroadcastMutation } from "@/modules/core/mutations";
import { QueryKeys } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import type { Operation } from "@hiveio/dhive";

export interface TransferEngineTokenPayload {
  to: string;
  symbol: string;
  quantity: string;
  memo: string;
}

export function useTransferEngineToken(username: string | undefined, auth?: AuthContextV2) {
  return useBroadcastMutation<TransferEngineTokenPayload>(
    ["wallet", "transfer-engine-token"],
    username,
    (payload) => {
      const json = JSON.stringify({
        contractName: "tokens",
        contractAction: "transfer",
        contractPayload: {
          symbol: payload.symbol,
          to: payload.to,
          quantity: payload.quantity,
          memo: payload.memo
        }
      });
      return [["custom_json", {
        required_auths: [username!],
        required_posting_auths: [],
        id: "ssc-mainnet-hive",
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
