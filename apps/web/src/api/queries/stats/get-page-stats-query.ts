import { getPageStatsQueryOptions, PageStatsResponse } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

export type { PageStatsResponse };

export interface UseStatsQueryOptions {
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
  const options = getPageStatsQueryOptions(url, dimensions, metrics, dateRange);

  return useQuery({
    ...options,
    enabled: enabled && options.enabled,
  });
}
