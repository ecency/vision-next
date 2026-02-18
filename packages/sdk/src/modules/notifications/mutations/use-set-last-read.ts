import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildSetLastReadOps } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

export interface SetLastReadPayload {
  date?: string;
}

export function useSetLastRead(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<SetLastReadPayload>(
    ["notifications", "set-last-read"],
    username,
    ({ date }) => buildSetLastReadOps(username!, date),
    async () => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.notifications.unreadCount(username),
        ]);
      }
    },
    auth
  );
}
