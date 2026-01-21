import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { Follow } from "../types";

/**
 * Get list of accounts following a user
 *
 * @param following - The account being followed
 * @param startFollower - Pagination start point (account name)
 * @param followType - Type of follow relationship (default: "blog")
 * @param limit - Maximum number of results (default: 100)
 */
export function getFollowersQueryOptions(
  following: string | undefined,
  startFollower: string,
  followType = "blog",
  limit = 100
) {
  return queryOptions({
    queryKey: ["accounts", "followers", following, startFollower, followType, limit],
    queryFn: () =>
      CONFIG.hiveClient.database.call("get_followers", [
        following,
        startFollower,
        followType,
        limit,
      ]) as Promise<Follow[]>,
    enabled: !!following,
  });
}
