import { useBroadcastMutation, invalidateAfterBroadcast, QueryKeys } from "@/modules/core";
import type { BroadcastMode } from "@/modules/core";
import { buildGrantPostingPermissionOp, type Authority } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

export interface GrantPostingPermissionPayload {
  currentPosting: Authority;
  grantedAccount: string;
  weightThreshold: number;
  memoKey: string;
  /**
   * @deprecated Ignored. Granting posting authority no longer rewrites account
   * metadata (it broadcasts account_update2 with empty, "no change" metadata),
   * so supplying this has no effect. Kept optional for backward compatibility.
   */
  jsonMetadata?: string;
}

export function useGrantPostingPermission(
  username: string | undefined,
  auth?: AuthContextV2,
  broadcastMode?: BroadcastMode
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
      await invalidateAfterBroadcast(auth?.adapter, broadcastMode, [
        QueryKeys.accounts.full(username),
      ]);
    },
    auth,
    'active',
    { broadcastMode }
  );
}
