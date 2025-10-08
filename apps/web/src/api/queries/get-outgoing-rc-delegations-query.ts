import { getOutgoingRc, RcDirectDelegation } from "@/api/hive";
import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";

export const getOutgoingRcDelegationsQuery = (username: string, limit = 100) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery({
    queryKey: [QueryIdentifiers.OUTGOING_RC_DELEGATIONS, username, limit],
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const res = await getOutgoingRc(username, pageParam ?? "", limit);
      let delegations: RcDirectDelegation[] = res.rc_direct_delegations || [];
      if (pageParam) {
        delegations = delegations.filter((delegation) => delegation.to !== pageParam);
      }
      return delegations;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage: RcDirectDelegation[]) =>
      lastPage.length === limit ? lastPage[lastPage.length - 1].to : undefined
  });
