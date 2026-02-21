"use client";

import { useFollow, type FollowPayload } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

/**
 * Web-specific follow mutation hook using SDK.
 *
 * Wraps the SDK's useFollow mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates relationship and account caches after following
 *
 * @returns Mutation result with follow function from SDK
 *
 * @example
 * ```typescript
 * const FollowButton = ({ targetUsername }) => {
 *   const { mutateAsync: follow, isPending } = useFollowMutation();
 *
 *   const handleFollow = async () => {
 *     try {
 *       await follow({ following: targetUsername });
 *       // Success! Cache updated automatically by SDK
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <Button onClick={handleFollow} disabled={isPending}>Follow</Button>;
 * };
 * ```
 */
export function useFollowMutation() {
  const username = useActiveUsername();

  // Create web broadcast adapter for SDK mutations
  const adapter = getWebBroadcastAdapter();

  // Use SDK's useFollow mutation with web adapter
  return useFollow(username, {
    adapter,
  });
}
