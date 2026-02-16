import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { QueryKeys } from "@/modules/core";
import { AccountFollowStats } from "../types";

/**
 * Get follow count (followers and following) for an account
 */
export function getFollowCountQueryOptions(username: string) {
  return queryOptions({
    queryKey: QueryKeys.accounts.followCount(username),
    queryFn: () =>
      CONFIG.hiveClient.database.call("get_follow_count", [
        username,
      ]) as Promise<AccountFollowStats>,
  });
}
