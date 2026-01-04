import { useQuery } from "@tanstack/react-query";
import { getVestingDelegationsQueryOptions } from "@ecency/sdk";

export function useGetVestingDelegationsQuery(username?: string, from?: string, limit?: number) {
  return useQuery(getVestingDelegationsQueryOptions(username, from, limit));
}

export { getVestingDelegationsQueryOptions as getVestingDelegationsQuery } from "@ecency/sdk";
