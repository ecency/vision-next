import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { callRPC } from "@/modules/core/hive-tx";

/**
 * Get list of usernames who reblogged a specific post
 */
export function getRebloggedByQueryOptions(author?: string, permlink?: string) {
  return queryOptions({
    queryKey: QueryKeys.posts.rebloggedBy(author ?? "", permlink ?? ""),
    queryFn: async () => {
      if (!author || !permlink) {
        return [];
      }

      const response = (await callRPC("condenser_api.get_reblogged_by", [author, permlink])) as string[];

      return Array.isArray(response) ? response : [];
    },
    enabled: !!author && !!permlink,
  });
}
