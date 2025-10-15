import { QueryIdentifiers } from "@/core/react-query";
import { getUnclaimedRewards } from "@/api/hive-engine";
import { TokenStatus } from "@/entities";
import { useQuery } from "@tanstack/react-query";

export function useHiveEngineUnclaimedRewardsQuery(account?: string) {
  return useQuery({
    queryKey: [QueryIdentifiers.HIVE_ENGINE_UNCLAIMED_REWARDS, account],
    staleTime: 60000,
    refetchInterval: 90000,
    enabled: Boolean(account),
    queryFn: async (): Promise<TokenStatus[]> => {
      if (!account) {
        throw new Error("[HiveEngine] No account provided for unclaimed rewards query");
      }

      return getUnclaimedRewards(account);
    },
  });
}
