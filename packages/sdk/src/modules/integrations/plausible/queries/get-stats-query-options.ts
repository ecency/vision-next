import { queryOptions } from "@tanstack/react-query";
import { CONFIG, getBoundFetch } from "@/modules/core";

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
  /**
   * Which dimension the `url` is matched against. `event:page` (default) matches
   * any visit that viewed the page; `visit:entry_page` matches only visits that
   * landed on it. The API route validates this against an allow-list.
   */
  filterBy?: "event:page" | "visit:entry_page";
  /**
   * Plausible `date_range`. Pass a tuple `[from, to]` (ISO `YYYY-MM-DD`) to scope
   * the query — e.g. a post's creation date through today. Scoping is essential:
   * ClickHouse orders events by `(site_id, toDate(timestamp), …)` and partitions
   * by month, so a bounded range prunes to a few granules instead of scanning the
   * whole history. Omitting it falls back to the route default (`"all"`), which on
   * a high-traffic site is a multi-second full scan. Plausible also accepts the
   * relative keywords `"day"`, `"7d"`, `"30d"`, `"all"`.
   */
  dateRange?: string | [string, string];
  enabled?: boolean;
}

export function getStatsQueryOptions({
  url,
  dimensions = [],
  metrics = ["visitors", "pageviews", "visit_duration"],
  filterBy = "event:page",
  dateRange,
  enabled = true,
}: UseStatsQueryOptions) {
  return queryOptions({
    queryKey: ["integrations", "plausible", url, dimensions, metrics, filterBy, dateRange],
    queryFn: async () => {
      const fetchApi = getBoundFetch();
      const response = await fetchApi(`${CONFIG.privateApiHost}/api/stats`, {
        method: "POST",
        body: JSON.stringify({
          metrics,
          url: encodeURIComponent(url),
          dimensions,
          filterBy,
          // Only forward a range when set, so the route keeps owning the default.
          ...(dateRange ? { date_range: dateRange } : {}),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // The proxy route returns 5xx (504/502) with an empty body on a Plausible
      // timeout/transport error, and Plausible itself can return a 4xx error JSON.
      // Without this guard those parse into an object with no `results`, and the UI
      // silently renders 0 — indistinguishable from a real zero. Throw instead so
      // React Query surfaces the error and retries.
      if (!response.ok) {
        throw new Error(`Failed to fetch Plausible stats: ${response.status}`);
      }

      return (await response.json()) as StatsResponse;
    },
    enabled: !!url && enabled,
    // Stats queries are now date-scoped and cheap; a single retry rides out a
    // transient slow scan without re-introducing the all-time pile-up.
    retry: 1,
  });
}
