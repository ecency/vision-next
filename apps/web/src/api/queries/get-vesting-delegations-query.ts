import { useQuery } from "@tanstack/react-query";
import { EcencyQueriesManager } from "@/core/react-query";
import { getVestingDelegationsQueryOptions } from "@ecency/sdk";

export function useGetVestingDelegationsQuery(username?: string, from?: string, limit?: number) {
  return useQuery(getVestingDelegationsQueryOptions(username, from, limit));
}

export const getVestingDelegationsQuery = (username?: string, from?: string, limit = 50) =>
  EcencyQueriesManager.generateClientServerQuery(
    getVestingDelegationsQueryOptions(username, from, limit)
  );
