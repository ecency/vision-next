import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import type { BroadcastMode } from "@/modules/core";
import { buildProposalCreateOp, type ProposalCreatePayload } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

export { type ProposalCreatePayload };

export function useProposalCreate(
  username: string | undefined,
  auth?: AuthContextV2,
  broadcastMode?: BroadcastMode
) {
  return useBroadcastMutation<ProposalCreatePayload>(
    ["proposals", "create"],
    username,
    (payload) => [
      buildProposalCreateOp(username!, payload)
    ],
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.accounts.full(username),
          QueryKeys.proposals.list(),
        ]);
      }
    },
    auth,
    'active',
    { broadcastMode }
  );
}
