import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { QueryKeys } from "@/modules/core";
import { Follow } from "../types";

/**
 * Get list of users that an account has muted
 *
 * @param username - The account username
 * @param limit - Maximum number of results (default: 100)
 */
export function getMutedUsersQueryOptions(username: string | undefined, limit = 100) {
  return queryOptions({
    queryKey: QueryKeys.accounts.mutedUsers(username!),
    queryFn: async () => {
      const response = (await CONFIG.hiveClient.database.call("get_following", [
        username,
        "",
        "ignore",
        limit,
      ])) as Follow[];

      return response.map((user) => user.following);
    },
    enabled: !!username,
  });
}
