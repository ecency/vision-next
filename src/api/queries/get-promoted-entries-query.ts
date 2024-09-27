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
      }
    }
  );

/**
 * Use this query for fetching promotion entries as single list in SSR
 * Because SSR feed page requires paginated response
 */
export const getPromotedEntriesInfiniteQuery = () =>
  EcencyQueriesManager.generateConfiguredClientServerInfiniteQuery(
    ({ visionFeatures }) => visionFeatures.promotions.enabled,
    {
      queryKey: [QueryIdentifiers.PROMOTED_ENTRIES, "infinite"],
      queryFn: async ({ pageParam }) => {
        if (pageParam === "fetched") {
          return [];
        }

        const response = await appAxios.get<Entry[]>(apiBase(`/private-api/promoted-entries`));
        return response.data;
      },
      initialData: { pages: [], pageParams: [] },
      initialPageParam: "empty",
      getNextPageParam: () => "fetched"
    }
  );
