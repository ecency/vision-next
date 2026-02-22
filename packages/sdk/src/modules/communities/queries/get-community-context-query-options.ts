import { queryOptions } from "@tanstack/react-query";
import { CONFIG, QueryKeys } from "@/modules/core";
import { CommunityRole } from "../types";

export function getCommunityContextQueryOptions(
  username: string | undefined,
  communityName: string | undefined
) {
  return queryOptions({
    queryKey: QueryKeys.communities.context(username!, communityName!),
    enabled: !!username && !!communityName,
    queryFn: async () => {
      const response = await CONFIG.hiveClient.call(
        "bridge",
        "get_community_context",
        {
          account: username,
          name: communityName,
        }
      );

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
