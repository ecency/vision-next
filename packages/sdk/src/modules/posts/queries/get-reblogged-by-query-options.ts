import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";

/**
 * Get list of usernames who reblogged a specific post
 */
export function getRebloggedByQueryOptions(author?: string, permlink?: string) {
  return queryOptions({
    queryKey: ["posts", "reblogged-by", author ?? "", permlink ?? ""],
    queryFn: async () => {
      if (!author || !permlink) {
        return [];
      }

      const response = (await CONFIG.hiveClient.call(
        "condenser_api",
        "get_reblogged_by",
        [author, permlink]
      )) as string[];

      return Array.isArray(response) ? response : [];
    },
    enabled: !!author && !!permlink,
  });
}
