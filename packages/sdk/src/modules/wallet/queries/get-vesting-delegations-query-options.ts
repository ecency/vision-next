import { infiniteQueryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { DelegatedVestingShare } from "../types";

/**
 * Get vesting delegations for an account with infinite scroll support
 *
 * @param username - The account username
 * @param limit - Maximum number of results per page (default: 50)
 */
export function getVestingDelegationsQueryOptions(
  username?: string,
  limit = 50
) {
  return infiniteQueryOptions({
    queryKey: ["wallet", "vesting-delegations", username, limit],
    initialPageParam: "" as string,
    queryFn: async ({ pageParam }: { pageParam: string }) => {
      const result = await CONFIG.hiveClient.database.call("get_vesting_delegations", [
        username,
        pageParam || "",
        limit,
      ]) as DelegatedVestingShare[];

      // Filter out duplicate first item on subsequent pages
      // Hive API is inclusive of the 'from' cursor
      if (pageParam && result.length > 0 && result[0]?.delegatee === pageParam) {
        return result.slice(1);
      }

      return result;
    },
    getNextPageParam: (lastPage: DelegatedVestingShare[]) => {
      // If we got fewer results than the limit, we've reached the end
      if (!lastPage || lastPage.length < limit) {
        return undefined;
      }

      // Return the last delegatee as the cursor for the next page
      const lastDelegation = lastPage[lastPage.length - 1];
      return lastDelegation?.delegatee;
    },
    enabled: !!username,
  });
}
