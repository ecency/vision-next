import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { DelegatedVestingShare } from "../types";

/**
 * Get vesting delegations for an account
 *
 * @param username - The account username
 * @param from - Pagination start point (delegatee name)
 * @param limit - Maximum number of results (default: 50)
 */
export function getVestingDelegationsQueryOptions(
  username?: string,
  from?: string,
  limit = 50
) {
  return queryOptions({
    queryKey: ["wallet", "vesting-delegations", username, from, limit],
    queryFn: () =>
      CONFIG.hiveClient.database.call("get_vesting_delegations", [
        username,
        from,
        limit,
      ]) as Promise<DelegatedVestingShare[]>,
    enabled: !!username,
  });
}
