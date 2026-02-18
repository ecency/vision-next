import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildGrantPostingPermissionOp, type Authority } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

export interface GrantPostingPermissionPayload {
  currentPosting: Authority;
  grantedAccount: string;
  weightThreshold: number;
  memoKey: string;
  jsonMetadata: string;
}

export function useGrantPostingPermission(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<GrantPostingPermissionPayload>(
    ["accounts", "grant-posting-permission"],
    username,
    (payload) => [
      buildGrantPostingPermissionOp(
        username!,
        payload.currentPosting,
        payload.grantedAccount,
        payload.weightThreshold,
        payload.memoKey,
        payload.jsonMetadata
      )
    ],
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.accounts.full(username),
        ]);
      }
    },
    auth,
    'active'
  );
}
