import { getOutgoingRc } from "@/api/hive";
import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";

export const getOutgoingRcDelegationsQuery = (username: string, limit = 100) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery({
    queryKey: [QueryIdentifiers.OUTGOING_RC_DELEGATIONS, username, limit],
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const res: any = await getOutgoingRc(username, pageParam ?? "", limit);
      let delegations = res.rc_direct_delegations || [];
      if (pageParam) {
        delegations = delegations.filter((d: any) => d.to !== pageParam);
      }
      return delegations;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage: any[]) =>
      lastPage.length === limit ? lastPage[lastPage.length - 1].to : undefined
  });
