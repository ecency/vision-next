import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import type { Vote } from "../types";

/**
 * Get a specific user's vote on a post
 * Useful when post has >1000 votes to efficiently get one user's vote
 *
 * @param username - The voter's username
 * @param author - The post author
 * @param permlink - The post permlink
 */
export function getUserPostVoteQueryOptions(
  username: string | undefined,
  author: string | undefined,
  permlink: string | undefined
) {
  return queryOptions({
    queryKey: ["posts", "user-vote", username, author, permlink],
    queryFn: async () => {
      const result = await CONFIG.hiveClient.call("database_api", "list_votes", {
        start: [username, author, permlink],
        limit: 1,
        order: "by_voter_comment"
      });

      // Return first vote if found, otherwise null
      return (result?.votes?.[0] || null) as Vote | null;
    },
    enabled: !!username && !!author && !!permlink,
  });
}
