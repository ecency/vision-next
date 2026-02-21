"use client";

import { useUnsubscribeCommunity, type UnsubscribeCommunityPayload } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

/**
 * Web-specific unsubscribe from community mutation hook using SDK.
 *
 * Wraps the SDK's useUnsubscribeCommunity mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates subscription and community caches after unsubscribing
 *
 * @returns Mutation result with unsubscribe function from SDK
 *
 * @example
 * ```typescript
 * const UnsubscribeButton = ({ community }) => {
 *   const { mutateAsync: unsubscribe, isPending } = useUnsubscribeCommunityMutation();
 *
 *   const handleUnsubscribe = async () => {
 *     try {
 *       await unsubscribe({ community: community.name });
 *       // Success! Cache updated automatically by SDK
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <Button onClick={handleUnsubscribe} disabled={isPending}>Unsubscribe</Button>;
 * };
 * ```
 */
export function useUnsubscribeCommunityMutation() {
  const username = useActiveUsername();

  // Get shared web broadcast adapter singleton for SDK mutations
  const adapter = getWebBroadcastAdapter();

  // Use SDK's useUnsubscribeCommunity mutation with web adapter
  return useUnsubscribeCommunity(username, {
    adapter,
  });
}
