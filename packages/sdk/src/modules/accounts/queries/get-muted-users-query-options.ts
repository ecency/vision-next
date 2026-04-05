import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { Follow } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

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
      const response = (await callRPC("condenser_api.get_following", [
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
