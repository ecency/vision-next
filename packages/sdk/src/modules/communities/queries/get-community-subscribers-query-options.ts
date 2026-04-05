import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { Subscription } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

/**
 * Get list of subscribers for a community
 *
 * @param communityName - The community name (e.g., "hive-123456")
 */
export function getCommunitySubscribersQueryOptions(communityName: string) {
  return queryOptions({
    queryKey: QueryKeys.communities.subscribers(communityName),
    queryFn: async () => {
      const response = await callRPC("bridge.list_subscribers", {
        community: communityName,
      });
      return (response as Subscription[] | null) ?? [];
    },
    staleTime: 60000,
  });
}
