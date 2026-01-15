import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { AccountFollowStats } from "../types";

/**
 * Get follow count (followers and following) for an account
 */
export function getFollowCountQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["accounts", "follow-count", username],
    queryFn: () =>
      CONFIG.hiveClient.database.call("get_follow_count", [
        username,
      ]) as Promise<AccountFollowStats>,
  });
}
