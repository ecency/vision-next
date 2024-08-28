import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import { Entry } from "@/entities";

export const getPromotedEntriesQuery = () =>
  EcencyQueriesManager.generateConfiguredClientServerQuery(
    ({ visionFeatures }) => visionFeatures.promotions.enabled,
    {
      queryKey: [QueryIdentifiers.PROMOTED_ENTRIES],
      queryFn: async () => {
        const response = await appAxios.get<Entry[]>(apiBase(`/private-api/promoted-entries`));
        return response.data;
      },
      initialData: []
    }
  );
