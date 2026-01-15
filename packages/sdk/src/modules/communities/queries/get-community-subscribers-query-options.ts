import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { Subscription } from "../types";

/**
 * Get list of subscribers for a community
 *
 * @param communityName - The community name (e.g., "hive-123456")
 */
export function getCommunitySubscribersQueryOptions(communityName: string) {
  return queryOptions({
    queryKey: ["communities", "subscribers", communityName],
    queryFn: async () => {
      const response = await CONFIG.hiveClient.call("bridge", "list_subscribers", {
        community: communityName,
      });
      return (response as Subscription[] | null) ?? [];
    },
    staleTime: 60000,
  });
}
