import { QueryIdentifiers } from "@/core/react-query";
import { appAxios } from "@/api/axios";
import { useQuery } from "@tanstack/react-query";

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
  dateRange?: string[];
  enabled?: boolean;
}

export function useGetStatsQuery({
  url,
  dimensions = [],
  metrics = ["visitors", "pageviews", "visit_duration"],
  dateRange,
  enabled = true
}: UseStatsQueryOptions) {
  return useQuery({
    queryKey: [QueryIdentifiers.PAGE_STATS, url, dimensions, metrics, dateRange],
    queryFn: async () => {
      const response = await appAxios.post<StatsResponse>(`/api/stats`, {
        metrics,
        url: encodeURIComponent(url),
        dimensions,
        date_range: dateRange
      });
      return response.data;
    },
    enabled: !!url && enabled
  });
}
