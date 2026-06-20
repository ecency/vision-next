"use client";

import { useQuery } from "@tanstack/react-query";
import {
  estimateRcPrecheck,
  getAccountRcQueryOptions,
  getRcStatsQueryOptions,
  type RcPrecheckOperation,
  type RcPrecheckResult
} from "@ecency/sdk";

/**
 * Client-side Resource Credits pre-check for the editor surfaces. Reuses the
 * same RC queries the AvailableCredits widget already loads, so it is
 * effectively free (cache hit) and never blocks the publish/comment/vote
 * action. Returns a non-ready result until the queries resolve.
 */
export function useRcPrecheck(
  username: string | undefined,
  operation: RcPrecheckOperation,
  buffer?: number
): RcPrecheckResult {
  const { data: rcAccounts } = useQuery(getAccountRcQueryOptions(username ?? ""));
  const { data: rcStats } = useQuery(getRcStatsQueryOptions());

  return estimateRcPrecheck({
    rcAccount: rcAccounts?.[0],
    rcStats,
    operation,
    buffer
  });
}
