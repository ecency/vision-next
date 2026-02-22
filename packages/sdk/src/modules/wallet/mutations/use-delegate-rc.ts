import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildDelegateRcOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

export interface DelegateRcPayload {
  to: string;
  maxRc: string | number;
}

export function useDelegateRc(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<DelegateRcPayload>(
    ["wallet", "delegate-rc"],
    username,
    ({ to, maxRc }) => [
      buildDelegateRcOp(username!, to, maxRc)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.accounts.full(username),
          QueryKeys.accounts.full(variables.to),
          QueryKeys.resourceCredits.account(username!),
          QueryKeys.resourceCredits.account(variables.to),
        ]);
      }
    },
    auth,
    'active'
  );
}
