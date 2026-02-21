"use client";

import { useDeleteComment, type DeleteCommentPayload } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

/**
 * Web-specific delete comment mutation hook using SDK.
 *
 * Wraps the SDK's useDeleteComment mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates parent post cache after deletion
 * - Automatically invalidates discussions cache (all sort orders)
 * - Automatically invalidates feed/blog caches
 *
 * @returns Mutation result with delete comment function from SDK
 *
 * @example
 * ```typescript
 * const DeleteButton = ({ entry, parent }) => {
 *   const { mutateAsync: deleteComment, isPending } = useDeleteCommentMutation();
 *
 *   const handleDelete = async () => {
 *     try {
 *       await deleteComment({
 *         author: entry.author,
 *         permlink: entry.permlink,
 *         parentAuthor: parent?.author,
 *         parentPermlink: parent?.permlink
 *       });
 *       // Success! Cache updated automatically by SDK
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <button onClick={handleDelete} disabled={isPending}>Delete</button>;
 * };
 * ```
 */
export function useDeleteCommentMutation() {
  const username = useActiveUsername();

  // Create web broadcast adapter for SDK mutations
  const adapter = getWebBroadcastAdapter();

  // Use SDK's useDeleteComment mutation with web adapter
  return useDeleteComment(username, {
    adapter,
  });
}
