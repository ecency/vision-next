import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { CommunityRole } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

export function getCommunityContextQueryOptions(
  username: string | undefined,
  communityName: string | undefined
) {
  return queryOptions({
    queryKey: QueryKeys.communities.context(username!, communityName!),
    enabled: !!username && !!communityName,
    queryFn: async () => {
      const response = await callRPC("bridge.get_community_context", {
          account: username,
          name: communityName,
        });

      return {
        role: response?.role ?? "guest",
        subscribed: response?.subscribed ?? false,
      } satisfies {
        role: CommunityRole;
        subscribed: boolean;
      };
    },
  });
}
