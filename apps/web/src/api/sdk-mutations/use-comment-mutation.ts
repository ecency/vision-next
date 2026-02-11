"use client";

import { useComment, type CommentPayload } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

/**
 * Web-specific comment/reply mutation hook using SDK.
 *
 * Wraps the SDK's useComment mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates feed/blog caches after posting
 * - Automatically invalidates parent post cache after replying
 * - Records user activity points (type 100 for posts, 110 for replies)
 *
 * @returns Mutation result with comment function from SDK
 *
 * @example
 * ```typescript
 * const CommentForm = ({ parentAuthor, parentPermlink }) => {
 *   const { mutateAsync: comment, isPending } = useCommentMutation();
 *
 *   const handleSubmit = async (text: string) => {
 *     try {
 *       await comment({
 *         author: 'alice',
 *         permlink: 're-bob-great-post-20260211',
 *         parentAuthor,
 *         parentPermlink,
 *         title: '',
 *         body: text,
 *         jsonMetadata: { app: 'ecency/3.0.0' }
 *       });
 *       // Success! Cache updated automatically by SDK
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <form onSubmit={handleSubmit} />;
 * };
 * ```
 */
export function useCommentMutation() {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  // Create web broadcast adapter for SDK mutations
  const adapter = createWebBroadcastAdapter();

  // Use SDK's useComment mutation with web adapter
  return useComment(username, {
    adapter,
  });
}
