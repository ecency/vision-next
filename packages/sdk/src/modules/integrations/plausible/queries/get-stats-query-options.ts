import { queryOptions } from "@tanstack/react-query";
import { getBoundFetch } from "@/modules/core";

export interface StatsResponse {
  results: [
    {
      metrics: number[];
      dimensions: string[];
    },
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

export function getStatsQueryOptions({
  url,
  dimensions = [],
  metrics = ["visitors", "pageviews", "visit_duration"],
  enabled = true,
}: UseStatsQueryOptions) {
  return queryOptions({
    queryKey: ["integrations", "plausible", url, dimensions, metrics],
    queryFn: async () => {
      const fetchApi = getBoundFetch();
      const response = await fetchApi(`https://ecency.com/api/stats`, {
        method: "POST",
        body: JSON.stringify({
          metrics,
          url: encodeURIComponent(url),
          dimensions,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      return (await response.json()) as StatsResponse;
    },
    enabled: !!url && enabled,
  });
}
