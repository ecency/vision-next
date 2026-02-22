import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildCommentOp, buildCommentOptionsOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";
import type { Operation } from "@hiveio/dhive";

/**
 * Payload for creating a cross-post.
 */
export interface CrossPostPayload {
  /** Author of the cross-post (current user) */
  author: string;
  /** Permlink of the cross-post (usually: original-permlink-community-id) */
  permlink: string;
  /** Community ID to cross-post to (used as parent_permlink) */
  parentPermlink: string;
  /** Title of the cross-post (same as original) */
  title: string;
  /** Body of the cross-post (includes reference to original) */
  body: string;
  /** JSON metadata (must include original_author, original_permlink, tags, app) */
  jsonMetadata: Record<string, any>;
  /** Optional: Comment options (beneficiaries, rewards) */
  options?: {
    /** Maximum accepted payout (e.g., "0.000 HBD" for declined payout) */
    maxAcceptedPayout?: string;
    /** Percent of payout in HBD (10000 = 100%) */
    percentHbd?: number;
    /** Allow votes on this content */
    allowVotes?: boolean;
    /** Allow curation rewards */
    allowCurationRewards?: boolean;
  };
}

/**
 * React Query mutation hook for creating cross-posts.
 *
 * A cross-post is a special type of post that references an original post
 * and publishes it to a different community.
 *
 * @param username - The username creating the cross-post (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Post-Broadcast Actions:**
 * - Invalidates feed/blog caches to show the new cross-post
 *
 * **Operations:**
 * - Always includes a comment operation (with empty parent_author for top-level post)
 * - Optionally includes comment_options operation for rewards/beneficiaries
 *
 * **Metadata Requirements:**
 * The jsonMetadata must include:
 * - `original_author`: Author of the original post
 * - `original_permlink`: Permlink of the original post
 * - `tags`: Tags for the cross-post (typically ["cross-post"])
 * - `app`: Application identifier (e.g., "ecency/3.0.0-vision")
 *
 * @example
 * ```typescript
 * const crossPostMutation = useCrossPost(username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Create a cross-post
 * crossPostMutation.mutate({
 *   author: 'alice',
 *   permlink: 'great-post-hive-123456',
 *   parentPermlink: 'hive-123456', // community ID
 *   title: 'Great Post',
 *   body: 'This is a cross post of [@bob/great-post](/technology/@bob/great-post) by @alice.<br><br>Check this out!',
 *   jsonMetadata: {
 *     app: 'ecency/3.0.0-vision',
 *     tags: ['cross-post'],
 *     original_author: 'bob',
 *     original_permlink: 'great-post'
 *   },
 *   options: {
 *     maxAcceptedPayout: '0.000 HBD',
 *     allowCurationRewards: false
 *   }
 * });
 * ```
 */
export function useCrossPost(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<CrossPostPayload>(
    ["posts", "cross-post"],
    username,
    (payload) => {
      const operations: Operation[] = [];

      // Main comment operation (empty parent_author for top-level post)
      operations.push(
        buildCommentOp(
          payload.author,
          payload.permlink,
          "", // empty parent_author for top-level post
          payload.parentPermlink, // community ID
          payload.title,
          payload.body,
          payload.jsonMetadata
        )
      );

      // Optional comment options operation
      if (payload.options) {
        const {
          maxAcceptedPayout = "1000000.000 HBD",
          percentHbd = 10000,
          allowVotes = true,
          allowCurationRewards = true,
        } = payload.options;

        operations.push(
          buildCommentOptionsOp(
            payload.author,
            payload.permlink,
            maxAcceptedPayout,
            percentHbd,
            allowVotes,
            allowCurationRewards,
            [] // No beneficiaries for cross-posts
          )
        );
      }

      return operations;
    },
    async (_result: any, variables) => {
      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        const queriesToInvalidate: any[] = [
          QueryKeys.accounts.full(username),
          // Invalidate target community feed so cross-post appears
          {
            predicate: (query: any) => {
              const key = query.queryKey;
              return (
                Array.isArray(key) &&
                key[0] === "posts" &&
                key[1] === "posts-ranked" &&
                key[3] === variables.parentPermlink
              );
            }
          }
        ];
        await auth.adapter.invalidateQueries(queriesToInvalidate);
      }
    },
    auth
  );
}
