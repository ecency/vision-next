import { getHiveEngineUnclaimedRewards } from "../requests";
import { queryOptions } from "@tanstack/react-query";
import type { HiveEngineTokenStatus } from "../types";

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
        const data = await getHiveEngineUnclaimedRewards<HiveEngineTokenStatus>(
          username as string
        );
        return Object.values(data).filter(
          ({ pending_token }) => pending_token > 0
        );
      } catch (e) {
        return [];
      }
    },
  });
}
