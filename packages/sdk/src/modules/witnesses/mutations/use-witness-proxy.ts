import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildWitnessProxyOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

export interface WitnessProxyPayload {
  proxy: string;
}

export function useWitnessProxy(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<WitnessProxyPayload>(
    ["witnesses", "proxy"],
    username,
    ({ proxy }) => [
      buildWitnessProxyOp(username!, proxy)
    ],
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.accounts.full(username),
          QueryKeys.witnesses.proxy(),
        ]);
      }
    },
    auth,
    'active'
  );
}
