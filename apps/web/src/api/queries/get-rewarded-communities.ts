import { getRewardedCommunitiesQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

export function useGetRewardedCommunities() {
  return useQuery(getRewardedCommunitiesQueryOptions());
}
