import { queryOptions } from "@tanstack/react-query";
import { CONFIG, QueryKeys } from "@/modules/core";
import { RewardedCommunity } from "../types/rewarded-community";

export function getRewardedCommunitiesQueryOptions() {
  return queryOptions({
    queryKey: QueryKeys.communities.rewarded(),
    queryFn: async () => {
      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/rewarded-communities",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch rewarded communities: ${response.status}`);
      }

      return response.json() as Promise<RewardedCommunity[]>;
    },
  });
}
