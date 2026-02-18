import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildPinPostOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

export interface PinPostPayload {
  community: string;
  account: string;
  permlink: string;
  pin: boolean;
}

export function usePinPost(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<PinPostPayload>(
    ["communities", "pin-post"],
    username,
    ({ community, account, permlink, pin }) => [
      buildPinPostOp(username!, community, account, permlink, pin)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.posts.entry(`/@${variables.account}/${variables.permlink}`),
          [...QueryKeys.communities.singlePrefix(variables.community)],
        ]);
      }
    },
    auth
  );
}
