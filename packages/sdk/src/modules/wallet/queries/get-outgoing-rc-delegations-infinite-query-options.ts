import { infiniteQueryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { RcDirectDelegation, RcDirectDelegationsResponse } from "../types/rc-direct-delegation";

type RcPage = RcDirectDelegation[];
type RcCursor = string | null;

/**
 * Get outgoing RC delegations for an account
 *
 * @param username - Account name to get delegations for
 * @param limit - Number of delegations per page
 */
export function getOutgoingRcDelegationsInfiniteQueryOptions(username: string, limit = 100) {
  return infiniteQueryOptions<RcPage, Error, RcPage, (string | number)[], RcCursor>({
    queryKey: ["wallet", "outgoing-rc-delegations", username, limit],
    initialPageParam: null as RcCursor,

    queryFn: async ({ pageParam }: { pageParam: RcCursor }) => {
      const response = await CONFIG.hiveClient
        .call("rc_api", "list_rc_direct_delegations", {
          start: [username, pageParam ?? ""],
          limit,
        })
        .then((r: any) => r as RcDirectDelegationsResponse);

      let delegations: RcDirectDelegation[] = response.rc_direct_delegations || [];

      // Filter out the starting delegation when paginating
      if (pageParam) {
        delegations = delegations.filter((delegation) => delegation.to !== pageParam);
      }

      return delegations;
    },

    getNextPageParam: (lastPage: RcPage): RcCursor =>
      lastPage.length === limit ? lastPage[lastPage.length - 1].to : null,
  });
}
