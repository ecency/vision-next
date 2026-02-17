import { useBroadcastMutation } from "@/modules/core/mutations";
import { QueryKeys } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import type { Operation } from "@hiveio/dhive";

export interface PowerLarynxPayload {
  mode: "up" | "down";
  amount: number;
}

export function usePowerLarynx(username: string | undefined, auth?: AuthContextV2) {
  return useBroadcastMutation<PowerLarynxPayload>(
    ["wallet", "power-larynx"],
    username,
    (payload) => {
      const json = JSON.stringify({ amount: payload.amount * 1000 });
      return [["custom_json", {
        id: `spkcc_power_${payload.mode}`,
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
