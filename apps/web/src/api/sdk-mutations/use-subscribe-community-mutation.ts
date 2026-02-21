"use client";

import { useSubscribeCommunity, type SubscribeCommunityPayload } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

/**
 * Web-specific subscribe to community mutation hook using SDK.
 *
 * Wraps the SDK's useSubscribeCommunity mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates subscription and community caches after subscribing
 *
 * @returns Mutation result with subscribe function from SDK
 *
 * @example
 * ```typescript
 * const SubscribeButton = ({ community }) => {
 *   const { mutateAsync: subscribe, isPending } = useSubscribeCommunityMutation();
 *
 *   const handleSubscribe = async () => {
 *     try {
 *       await subscribe({ community: community.name });
 *       // Success! Cache updated automatically by SDK
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <Button onClick={handleSubscribe} disabled={isPending}>Subscribe</Button>;
 * };
 * ```
 */
export function useSubscribeCommunityMutation() {
  const username = useActiveUsername();

  // Get shared web broadcast adapter singleton for SDK mutations
  const adapter = getWebBroadcastAdapter();

  // Use SDK's useSubscribeCommunity mutation with web adapter
  return useSubscribeCommunity(username, {
    adapter,
  });
}
