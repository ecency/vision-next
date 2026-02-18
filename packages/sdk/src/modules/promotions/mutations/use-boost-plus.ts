import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildBoostPlusOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

export interface BoostPlusPayload {
  account: string;
  duration: number;
}

export function useBoostPlus(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<BoostPlusPayload>(
    ["promotions", "boost-plus"],
    username,
    ({ account, duration }) => [
      buildBoostPlusOp(username!, account, duration)
    ],
    async (_data, { account }) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.accounts.full(username),
          QueryKeys.promotions.boostPlusAccounts(account),
        ]);
      }
    },
    auth,
    'active'
  );
}
