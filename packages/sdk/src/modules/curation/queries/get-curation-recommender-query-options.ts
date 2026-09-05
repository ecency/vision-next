import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { fetchCurationRecommenderStats } from "../requests";

const ACCOUNT_RE = /^[a-z0-9.-]{3,16}$/;

/**
 * One recommender's 90-day scorecard (route 14): how many recommendations they
 * made, how many were curated, dismissed or withdrawn, the resulting precision
 * and whether they count as trusted. Public and memoized 60 s at the gateway,
 * so a popover that opens twice costs one request.
 *
 * The route answers zeros with a neutral precision for a name it has never
 * seen, so a missing scorecard is data rather than an error.
 */
export function getCurationRecommenderQueryOptions(username: string) {
  const valid = ACCOUNT_RE.test(username ?? "");

  return queryOptions({
    queryKey: QueryKeys.curation.recommender(username),
    queryFn: ({ signal }) => {
      // Guarded twice: `enabled` gates automatic fetching only, a prefetch
      // still runs this.
      if (!valid) {
        throw new Error("[SDK][Curation] invalid recommender username");
      }
      return fetchCurationRecommenderStats(username, signal);
    },
    enabled: valid,
    staleTime: 60_000,
  });
}
