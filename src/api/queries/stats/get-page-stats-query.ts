import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { appAxios } from "@/api/axios";

interface StatsResponse {
  results: [
    {
      metrics: [visitors: number, pageviews: number, visit_duration: number];
      dimensions: [country: string, device: string];
    }
  ];
  query: {
    site_id: string;
    metrics: string[];
    date_range: string[];
    filters: unknown[];
  };
}

export function useGetStatsQuery(url: string) {
  return EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.PAGE_STATS, url],
    queryFn: async () => {
      const response = await appAxios.get<StatsResponse>(
        `/api/stats?url=${encodeURIComponent(url)}`
      );
      return response.data;
    },
    enabled: !!url
  });
}
