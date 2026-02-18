import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { QueryKeys } from "@/modules/core";
import { Follow } from "../types";

/**
 * Get list of accounts that a user is following
 *
 * @param follower - The account doing the following
 * @param startFollowing - Pagination start point (account name)
 * @param followType - Type of follow relationship (default: "blog")
 * @param limit - Maximum number of results (default: 100)
 */
export function getFollowingQueryOptions(
  follower: string,
  startFollowing: string,
  followType = "blog",
  limit = 100
) {
  return queryOptions({
    queryKey: QueryKeys.accounts.following(follower, startFollowing, followType, limit),
    queryFn: () =>
      CONFIG.hiveClient.database.call("get_following", [
        follower,
        startFollowing,
        followType,
        limit,
      ]) as Promise<Follow[]>,
    enabled: !!follower,
  });
}
