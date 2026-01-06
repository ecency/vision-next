import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { ReferralStat } from "../types/referral";

interface ReferralStatsResponse {
  total?: number;
  rewarded?: number;
}

export function getReferralsStatsQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["accounts", "referrals-stats", username],
    queryFn: async () => {
      const response = await fetch(
        CONFIG.privateApiHost + `/private-api/referrals/${username}/stats`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch referral stats: ${response.status}`);
      }

      const data = await response.json() as ReferralStatsResponse;

      if (!data) {
        throw new Error("No Referrals for this user!");
      }

      return {
        total: data.total ?? 0,
        rewarded: data.rewarded ?? 0,
      } as ReferralStat;
    },
  });
}
