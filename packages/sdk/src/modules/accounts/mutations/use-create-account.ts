import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildAccountCreateOp, buildCreateClaimedAccountOp, type AccountKeys } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

export interface CreateAccountPayload {
  newAccountName: string;
  keys: AccountKeys;
  fee: string;
  /** If true, uses a claimed account token instead of paying the fee */
  useClaimed?: boolean;
}

export function useCreateAccount(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<CreateAccountPayload>(
    ["accounts", "create"],
    username,
    (payload) => [
      payload.useClaimed
        ? buildCreateClaimedAccountOp(username!, payload.newAccountName, payload.keys)
        : buildAccountCreateOp(username!, payload.newAccountName, payload.keys, payload.fee)
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
