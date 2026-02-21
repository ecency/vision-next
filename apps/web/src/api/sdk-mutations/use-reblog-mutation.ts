"use client";

import { useReblog, type ReblogPayload } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

/**
 * Web-specific reblog mutation hook using SDK.
 *
 * Wraps the SDK's useReblog mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates blog feed and post cache after reblogging
 * - Records user activity points (type 130)
 *
 * @returns Mutation result with reblog function from SDK
 *
 * @example
 * ```typescript
 * const ReblogButton = ({ author, permlink }) => {
 *   const { mutateAsync: reblog, isPending } = useReblogMutation();
 *
 *   const handleReblog = async () => {
 *     try {
 *       await reblog({ author, permlink });
 *       // Success! Cache updated automatically by SDK
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   const handleDeleteReblog = async () => {
 *     try {
 *       await reblog({ author, permlink, deleteReblog: true });
 *       // Success! Reblog removed and cache updated
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <ReblogButton onClick={handleReblog} disabled={isPending} />;
 * };
 * ```
 */
export function useReblogMutation() {
  const username = useActiveUsername();

  // Get shared web broadcast adapter singleton for SDK mutations
  const adapter = getWebBroadcastAdapter();

  // Use SDK's useReblog mutation with web adapter
  return useReblog(username, {
    adapter,
  });
}
