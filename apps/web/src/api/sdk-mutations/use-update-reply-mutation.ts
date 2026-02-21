"use client";

import { useUpdateReply, type UpdateReplyPayload } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

/**
 * Web-specific update reply mutation hook using SDK.
 *
 * Wraps the SDK's useUpdateReply mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates parent post cache after update
 * - Automatically invalidates discussions cache (all sort orders)
 * - Automatically invalidates RC cache
 *
 * Note: The web layer should handle optimistic updates separately.
 * This hook only handles the blockchain broadcast and cache invalidation.
 *
 * @returns Mutation result with update reply function from SDK
 *
 * @example
 * ```typescript
 * const EditCommentButton = ({ entry }) => {
 *   const { mutateAsync: updateReply, isPending } = useUpdateReplyMutation();
 *
 *   const handleUpdate = async (newText: string) => {
 *     try {
 *       await updateReply({
 *         author: entry.author,
 *         permlink: entry.permlink,
 *         parentAuthor: entry.parent_author,
 *         parentPermlink: entry.parent_permlink,
 *         title: '',
 *         body: newText,
 *         jsonMetadata: entry.json_metadata,
 *         rootAuthor: entry.parent_author,
 *         rootPermlink: entry.parent_permlink
 *       });
 *       // Success! Cache updated automatically by SDK
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <button onClick={() => handleUpdate('Updated text')} disabled={isPending}>Update</button>;
 * };
 * ```
 */
export function useUpdateReplyMutation() {
  const username = useActiveUsername();

  // Create web broadcast adapter for SDK mutations
  const adapter = getWebBroadcastAdapter();

  // Use SDK's useUpdateReply mutation with web adapter
  return useUpdateReply(username, {
    adapter,
  });
}
