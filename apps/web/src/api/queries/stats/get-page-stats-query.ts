import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { appAxios } from "@/api/axios";

export interface StatsResponse {
  results: [
    {
      metrics: number[];
      dimensions: string[];
    }
  ];
  query: {
    site_id: string;
    metrics: string[];
    date_range: string[];
    filters: string[];
  };
}
interface UseStatsQueryOptions {
  url: string;
  dimensions?: string[];
  metrics?: string[];
  enabled?: boolean;
}

export function useGetStatsQuery({
                                   url,
                                   dimensions = [],
                                   metrics = ["visitors", "pageviews", "visit_duration"],
                                   enabled = true
                                 }: UseStatsQueryOptions) {
  return EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.PAGE_STATS, url, dimensions, metrics],
    queryFn: async () => {
      const response = await appAxios.post<StatsResponse>(`/api/stats`, {
        metrics,
        url: encodeURIComponent(url),
        dimensions
      });
      return response.data;
    },
    enabled: !!url && enabled
  });
}

