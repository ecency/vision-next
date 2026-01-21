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
      // Request one extra item on subsequent pages to handle inclusive cursor
      const fetchLimit = pageParam ? limit + 1 : limit;

      const result = await CONFIG.hiveClient.database.call("get_vesting_delegations", [
        username,
        pageParam || "",
        fetchLimit,
      ]) as DelegatedVestingShare[];

      // Filter out duplicate first item on subsequent pages
      // Hive API is inclusive of the 'from' cursor
      if (pageParam && result.length > 0 && result[0]?.delegatee === pageParam) {
        // Return at most limit items after removing the duplicate
        return result.slice(1, limit + 1);
      }

      return result;
    },
    getNextPageParam: (lastPage: DelegatedVestingShare[]) => {
      // If we got fewer results than limit, we've reached the end
      if (!lastPage || lastPage.length < limit) {
        return undefined;
      }

      // Return the last delegatee as cursor for next page
      const lastDelegation = lastPage[lastPage.length - 1];
      return lastDelegation?.delegatee;
    },
    enabled: !!username,
  });
}
