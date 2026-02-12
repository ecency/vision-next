import { useBroadcastMutation } from "@/modules/core";
import { buildCommentOp, buildCommentOptionsOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";
import type { Operation } from "@hiveio/dhive";

/**
 * Beneficiary account and weight.
 */
export interface Beneficiary {
  /** Beneficiary account name */
  account: string;
  /** Beneficiary weight (10000 = 100%) */
  weight: number;
}

/**
 * Payload for creating a comment or post.
 */
export interface CommentPayload {
  /** Author of the comment/post */
  author: string;
  /** Permlink of the comment/post */
  permlink: string;
  /** Parent author (empty string for top-level posts) */
  parentAuthor: string;
  /** Parent permlink (category/tag for top-level posts) */
  parentPermlink: string;
  /** Title of the post (empty for comments) */
  title: string;
  /** Content body */
  body: string;
  /** JSON metadata object */
  jsonMetadata: Record<string, any>;
  /** Optional: Root post author (for nested replies, used for discussions cache invalidation) */
  rootAuthor?: string;
  /** Optional: Root post permlink (for nested replies, used for discussions cache invalidation) */
  rootPermlink?: string;
  /** Optional: Comment options (beneficiaries, rewards) */
  options?: {
    /** Maximum accepted payout (e.g., "1000000.000 HBD") */
    maxAcceptedPayout?: string;
    /** Percent of payout in HBD (10000 = 100%) */
    percentHbd?: number;
    /** Allow votes on this content */
    allowVotes?: boolean;
    /** Allow curation rewards */
    allowCurationRewards?: boolean;
    /** Beneficiaries array */
    beneficiaries?: Beneficiary[];
  };
}

/**
 * React Query mutation hook for creating posts and comments.
 *
 * This mutation broadcasts a comment operation (and optionally comment_options)
 * to create a new post or reply on the Hive blockchain.
 *
 * @param username - The username creating the comment/post (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Post-Broadcast Actions:**
 * - Records activity (type 100 for posts, 110 for comments) if adapter.recordActivity is available
 * - Invalidates feed caches to show the new content
 * - Invalidates parent post cache if this is a reply
 *
 * **Operations:**
 * - Always includes a comment operation
 * - Optionally includes comment_options operation for beneficiaries/rewards
 *
 * **Post vs Comment:**
 * - Post: parentAuthor = "", parentPermlink = category/tag
 * - Comment: parentAuthor = parent author, parentPermlink = parent permlink
 *
 * @example
 * ```typescript
 * const commentMutation = useComment(username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Create a post
 * commentMutation.mutate({
 *   author: 'alice',
 *   permlink: 'my-awesome-post-20260209',
 *   parentAuthor: '',
 *   parentPermlink: 'technology',
 *   title: 'My Awesome Post',
 *   body: 'This is the post content...',
 *   jsonMetadata: {
 *     tags: ['technology', 'hive'],
 *     app: 'ecency/3.0.0'
 *   },
 *   options: {
 *     beneficiaries: [
 *       { account: 'ecency', weight: 500 }
 *     ]
 *   }
 * });
 *
 * // Create a comment
 * commentMutation.mutate({
 *   author: 'bob',
 *   permlink: 're-alice-my-awesome-post-20260209',
 *   parentAuthor: 'alice',
 *   parentPermlink: 'my-awesome-post-20260209',
 *   title: '',
 *   body: 'Great post!',
 *   jsonMetadata: { app: 'ecency/3.0.0' }
 * });
 * ```
 */
export function useComment(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<CommentPayload>(
    ["posts", "comment"],
    username,
    (payload) => {
      const operations: Operation[] = [];

      // Main comment operation
      operations.push(
        buildCommentOp(
          payload.author,
          payload.permlink,
          payload.parentAuthor,
          payload.parentPermlink,
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
          beneficiaries = []
        } = payload.options;

        const extensions: any[] = [];

        // Add beneficiaries extension if provided
        if (beneficiaries.length > 0) {
          // Sort beneficiaries alphabetically by account name (required by blockchain)
          const sortedBeneficiaries = [...beneficiaries].sort((a, b) =>
            a.account.localeCompare(b.account)
          );

          extensions.push([
            0,
            {
              beneficiaries: sortedBeneficiaries.map(b => ({
                account: b.account,
                weight: b.weight
              }))
            }
          ]);
        }

        operations.push(
          buildCommentOptionsOp(
            payload.author,
            payload.permlink,
            maxAcceptedPayout,
            percentHbd,
            allowVotes,
            allowCurationRewards,
            extensions
          )
        );
      }

      return operations;
    },
    async (result: any, variables) => {
      // Determine if this is a post or comment
      const isPost = !variables.parentAuthor;
      const activityType = isPost ? 100 : 110;

      // Activity tracking (wrapped in try/catch to prevent failures from blocking cache invalidation)
      if (auth?.adapter?.recordActivity && result?.block_num && result?.id) {
        try {
          await auth.adapter.recordActivity(activityType, result.block_num, result.id);
        } catch (err) {
          // Log error but don't rethrow - activity tracking is non-critical
          console.warn('[useComment] Failed to record activity:', err);
        }
      }

      // Cache invalidation (always runs regardless of recordActivity outcome)
      if (auth?.adapter?.invalidateQueries) {
        const queriesToInvalidate: any[] = [
          ["posts", "feed", username],
          ["posts", "blog", username],
          ["account", username, "rc"] // RC decreases after posting/commenting
        ];

        // If this is a reply, invalidate parent post and discussions
        if (!isPost) {
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
