import { InfiniteData, QueryClient } from "@tanstack/react-query";
import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { getWitnessesByVote } from "@/api/hive";
import { Witness } from "@/entities";

// One page = array of witnesses; cursor = last owner's name (string)
type WitnessPage = Witness[];
type WitnessCursor = string;

export const getWitnessesQuery = (limit: number) =>
    EcencyQueriesManager.generateClientServerInfiniteQuery<WitnessPage, WitnessCursor>({
        queryKey: [QueryIdentifiers.WITNESSES, limit],
        initialData: { pages: [], pageParams: [] },
        initialPageParam: "" as WitnessCursor,

        // annotate pageParam to avoid implicit-any
        queryFn: async ({ pageParam }: { pageParam: WitnessCursor }) =>
            getWitnessesByVote(pageParam, limit),

        // fully type the args; return next cursor or undefined to stop
        getNextPageParam: (
            lastPage: WitnessPage,
            _allPages: WitnessPage[],
            _lastPageParam: WitnessCursor | undefined,
            _allPageParams: (WitnessCursor | undefined)[]
        ): WitnessCursor | undefined => {
            const last = lastPage?.[lastPage.length - 1];
            return last ? last.owner : undefined;
        },
    });

export async function prefetchWitnessesQuery(queryClient: QueryClient) {
    const page = await getWitnessesByVote("", 50);

    return queryClient.setQueryData(
        [QueryIdentifiers.WITNESSES, 50],
        {
            pageParams: ["" as WitnessCursor],
            pages: [page] as WitnessPage[],
        } as InfiniteData<WitnessPage, WitnessCursor>
    );
}
