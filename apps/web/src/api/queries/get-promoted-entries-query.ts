import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import { Entry } from "@/entities";

export const getPromotedEntriesQuery = () =>
    EcencyQueriesManager.generateConfiguredClientServerQuery(
        ({ visionFeatures }) => visionFeatures.promotions.enabled,
        {
            queryKey: [QueryIdentifiers.PROMOTED_ENTRIES, "list"],
            queryFn: async () => {
                const response = await appAxios.get<Entry[]>(apiBase(`/private-api/promoted-entries`));
                return response.data;
            },
        }
    );

/** Use this for SSR where the page expects an infinite shape */
type PromotedPage = Entry[];
type PromotedCursor = "empty" | "fetched";

export const getPromotedEntriesInfiniteQuery = () =>
    EcencyQueriesManager.generateConfiguredClientServerInfiniteQuery<PromotedPage, PromotedCursor>(
        ({ visionFeatures }) => visionFeatures.promotions.enabled,
        {
            queryKey: [QueryIdentifiers.PROMOTED_ENTRIES, "infinite"],
            // Don't set initialData here - let it use prefetched data from server
            // initialData: { pages: [], pageParams: [] },
            initialPageParam: "empty" as PromotedCursor,

            // ⬇️ annotate pageParam
            queryFn: async ({ pageParam }: { pageParam: PromotedCursor }) => {
                if (pageParam === "fetched") return [];
                const response = await appAxios.get<Entry[]>(apiBase(`/private-api/promoted-entries`));
                return response.data;
            },

            // ⬇️ optional full typing of args
            getNextPageParam: (
                _lastPage: PromotedPage,
                _allPages: PromotedPage[],
                _lastPageParam: PromotedCursor
            ): PromotedCursor => "fetched",
        }
    );
