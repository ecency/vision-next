import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { AccountFollowStats } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

/**
 * Get follow count (followers and following) for an account
 */
export function getFollowCountQueryOptions(username: string) {
  return queryOptions({
    queryKey: QueryKeys.accounts.followCount(username),
    queryFn: () =>
      callRPC("condenser_api.get_follow_count", [
        username,
      ]) as Promise<AccountFollowStats>,
  });
}
