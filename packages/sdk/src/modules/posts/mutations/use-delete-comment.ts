import { useBroadcastMutation } from "@/modules/core";
import { buildDeleteCommentOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

/**
 * Payload for deleting a comment or post.
 */
export interface DeleteCommentPayload {
  /** Author of the comment/post to delete */
  author: string;
  /** Permlink of the comment/post to delete */
  permlink: string;
  /** Optional: Parent author (for cache invalidation of discussions) */
  parentAuthor?: string;
  /** Optional: Parent permlink (for cache invalidation of discussions) */
  parentPermlink?: string;
  /** Optional: Root post author (for nested replies, used for discussions cache invalidation) */
  rootAuthor?: string;
  /** Optional: Root post permlink (for nested replies, used for discussions cache invalidation) */
  rootPermlink?: string;
}

/**
 * React Query mutation hook for deleting posts and comments.
 *
 * This mutation broadcasts a delete_comment operation to the Hive blockchain.
 *
 * @param username - The username deleting the comment/post (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Post-Broadcast Actions:**
 * - Invalidates parent post cache if this is a reply
 * - Invalidates discussions cache (all sort orders) for the parent/root post
 * - Invalidates feed/blog caches to reflect the deletion
 *
 * **Important:**
 * - Only the author can delete their own content
 * - Content can only be deleted if it has no replies and no votes
 * - After 7 days (payout), content cannot be deleted
 *
 * @example
 * ```typescript
 * const deleteCommentMutation = useDeleteComment(username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Delete a comment
 * deleteCommentMutation.mutate({
 *   author: 'alice',
 *   permlink: 're-bob-great-post-20260209',
 *   parentAuthor: 'bob',
 *   parentPermlink: 'great-post-20260209',
 *   rootAuthor: 'bob',
 *   rootPermlink: 'great-post-20260209'
 * });
 *
 * // Delete a top-level post
 * deleteCommentMutation.mutate({
 *   author: 'alice',
 *   permlink: 'my-post-20260209'
 * });
 * ```
 */
export function useDeleteComment(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<DeleteCommentPayload>(
    ["posts", "deleteComment"],
    username,
    ({ author, permlink }) => [
      buildDeleteCommentOp(author, permlink)
    ],
    async (_result: any, variables) => {
      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        const queriesToInvalidate: any[] = [
          ["posts", "feed", username],
          ["posts", "blog", username],
        ];

        // If this is a reply, invalidate parent post and discussions
        if (variables.parentAuthor && variables.parentPermlink) {
          // Invalidate parent entry
          queriesToInvalidate.push([
            "posts",
            "entry",
            `/@${variables.parentAuthor}/${variables.parentPermlink}`
          ]);

          // Invalidate discussions (matches all sort orders)
          // Use partial key to match all sort order variants
          // For nested replies, use rootAuthor/rootPermlink to match the root post's discussions
          // Fall back to parentAuthor/parentPermlink for direct replies to posts
          const discussionsAuthor = variables.rootAuthor || variables.parentAuthor;
          const discussionsPermlink = variables.rootPermlink || variables.parentPermlink;

          queriesToInvalidate.push({
            predicate: (query: any) => {
              const key = query.queryKey;
              return (
                Array.isArray(key) &&
                key[0] === "posts" &&
                key[1] === "discussions" &&
                key[2] === discussionsAuthor &&
                key[3] === discussionsPermlink
              );
            }
          });
        }

        await auth.adapter.invalidateQueries(queriesToInvalidate);
      }
    },
    auth
  );
}
