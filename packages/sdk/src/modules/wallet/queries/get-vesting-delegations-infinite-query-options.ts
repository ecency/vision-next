import { infiniteQueryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { DelegatedVestingShare } from "../types";

type VestingDelegationsPage = DelegatedVestingShare[];
type VestingDelegationsCursor = string | null;

/**
 * Get vesting delegations for an account (infinite query version)
 *
 * @param username - The account username
 * @param limit - Maximum number of results per page (default: 100)
 */
export function getVestingDelegationsInfiniteQueryOptions(
  username?: string,
  limit = 100
) {
  return infiniteQueryOptions<
    VestingDelegationsPage,
    Error,
    VestingDelegationsPage,
    (string | number | undefined)[],
    VestingDelegationsCursor
  >({
    queryKey: ["wallet", "vesting-delegations", username, limit],
    initialPageParam: null as VestingDelegationsCursor,

    queryFn: async ({ pageParam }: { pageParam: VestingDelegationsCursor }) => {
      const delegations = await CONFIG.hiveClient.database.call(
        "get_vesting_delegations",
        [username, pageParam ?? "", limit]
      ) as DelegatedVestingShare[];

      // Filter out the starting delegation when paginating
      if (pageParam) {
        return delegations.filter((delegation) => delegation.delegatee !== pageParam);
      }

      return delegations;
    },

    getNextPageParam: (lastPage: VestingDelegationsPage): VestingDelegationsCursor =>
      lastPage.length === limit ? lastPage[lastPage.length - 1].delegatee : null,

    enabled: !!username,
  });
}