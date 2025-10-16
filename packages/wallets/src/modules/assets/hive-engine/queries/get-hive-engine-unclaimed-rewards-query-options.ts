import { CONFIG } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { HiveEngineTokenStatus } from "../types";

export function getHiveEngineUnclaimedRewardsQueryOptions(
  username: string | undefined
) {
  return queryOptions({
    queryKey: ["assets", "hive-engine", "unclaimed", username],
    staleTime: 60000,
    refetchInterval: 90000,
    enabled: !!username,
    queryFn: async () => {
      try {
        const response = await fetch(
          CONFIG.privateApiHost +
            `/private-api/engine-reward-api/${username}?hive=1`
        );
        if (!response.ok) {
          return [];
        }

        const data = (await response.json()) as Record<
          string,
          HiveEngineTokenStatus
        >;

        return Object.values(data).filter(
          ({ pending_token }) => pending_token > 0
        );
      } catch (e) {
        return [];
      }
    },
  });
}
