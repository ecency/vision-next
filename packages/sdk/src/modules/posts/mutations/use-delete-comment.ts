import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildDeleteCommentOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";
import {
  removeOptimisticDiscussionEntry,
  restoreDiscussionSnapshots,
} from "../cache/discussions-cache-utils";
import type { Entry } from "../types";

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
 * Includes optimistic removal from discussions cache with rollback on error.
 *
 * @param username - The username deleting the comment/post (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
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
          QueryKeys.accounts.full(username)
        ];

        // If this is a reply, invalidate parent post and discussions
        if (variables.parentAuthor && variables.parentPermlink) {
          queriesToInvalidate.push(
            QueryKeys.posts.entry(`/@${variables.parentAuthor}/${variables.parentPermlink}`)
          );

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
    auth,
    'posting',
    {
      // Optimistic removal: remove from discussions cache before broadcast
      onMutate: async (variables) => {
        const rootAuthor = variables.rootAuthor || variables.parentAuthor;
        const rootPermlink = variables.rootPermlink || variables.parentPermlink;

        if (rootAuthor && rootPermlink) {
          const snapshots = removeOptimisticDiscussionEntry(
            variables.author,
            variables.permlink,
            rootAuthor,
            rootPermlink
          );
          return { snapshots };
        }
        return {};
      },
      // Rollback on error: restore discussions cache
      onError: (_error, _variables, context) => {
        const { snapshots } = (context as { snapshots?: Map<readonly unknown[], Entry[]> }) ?? {};
        if (snapshots) {
          restoreDiscussionSnapshots(snapshots);
        }
      },
    }
  );
}
