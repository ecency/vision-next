import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildVoteOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";
import { EntriesCacheManagement } from "../cache/entries-cache-management";

/**
 * Payload for voting on a post or comment.
 */
export interface VotePayload {
  /** Author of the post/comment to vote on */
  author: string;
  /** Permlink of the post/comment to vote on */
  permlink: string;
  /** Vote weight (-10000 to 10000, where 10000 = 100% upvote, -10000 = 100% downvote) */
  weight: number;
  /** Optional estimated payout change for optimistic UI */
  estimated?: number;
}

/**
 * React Query mutation hook for voting on posts and comments.
 *
 * This mutation broadcasts a vote operation to the Hive blockchain,
 * supporting upvotes (positive weight) and downvotes (negative weight).
 *
 * @param username - The username of the voter (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Post-Broadcast Actions:**
 * - Records activity (type 120) if adapter.recordActivity is available
 * - Invalidates post cache to refetch updated vote data
 * - Invalidates voting power cache to show updated VP
 *
 * **Vote Weight:**
 * - 10000 = 100% upvote
 * - 0 = remove vote
 * - -10000 = 100% downvote
 *
 * @example
 * ```typescript
 * const voteMutation = useVote(username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Upvote a post
 * voteMutation.mutate({
 *   author: 'alice',
 *   permlink: 'my-awesome-post',
 *   weight: 10000
 * });
 *
 * // Remove vote
 * voteMutation.mutate({
 *   author: 'alice',
 *   permlink: 'my-awesome-post',
 *   weight: 0
 * });
 *
 * // Downvote
 * voteMutation.mutate({
 *   author: 'alice',
 *   permlink: 'my-awesome-post',
 *   weight: -10000
 * });
 * ```
 */
export function useVote(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<VotePayload>(
    ["posts", "vote"],
    username,
    ({ author, permlink, weight }) => [
      buildVoteOp(username!, author, permlink, weight)
    ],
    async (result: any, variables) => {
      // Optimistic vote list + payout update
      const entry = EntriesCacheManagement.getEntry(variables.author, variables.permlink);
      if (entry?.active_votes) {
        const newVotes = [
          ...entry.active_votes.filter((v) => v.voter !== username),
          ...(variables.weight !== 0 ? [{ rshares: variables.weight, voter: username! }] : [])
        ];
        const newPayout = entry.payout + (variables.estimated ?? 0);
        EntriesCacheManagement.updateVotes(
          variables.author,
          variables.permlink,
          newVotes,
          newPayout
        );
      }

      // Activity tracking
      if (auth?.adapter?.recordActivity && result?.block_num && result?.id) {
        await auth.adapter.recordActivity(120, result.block_num, result.id);
      }

      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.posts.entry(`/@${variables.author}/${variables.permlink}`),
          ["account", username, "votingPower"]
        ]);
      }
    },
    auth
  );
}
