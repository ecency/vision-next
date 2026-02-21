"use client";

import { useUnfollow, type UnfollowPayload } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

/**
 * Web-specific unfollow mutation hook using SDK.
 *
 * Wraps the SDK's useUnfollow mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates relationship and account caches after unfollowing
 *
 * @returns Mutation result with unfollow function from SDK
 *
 * @example
 * ```typescript
 * const UnfollowButton = ({ targetUsername }) => {
 *   const { mutateAsync: unfollow, isPending } = useUnfollowMutation();
 *
 *   const handleUnfollow = async () => {
 *     try {
 *       await unfollow({ following: targetUsername });
 *       // Success! Cache updated automatically by SDK
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <Button onClick={handleUnfollow} disabled={isPending}>Unfollow</Button>;
 * };
 * ```
 */
export function useUnfollowMutation() {
  const username = useActiveUsername();

  // Create web broadcast adapter for SDK mutations
  const adapter = getWebBroadcastAdapter();

  // Use SDK's useUnfollow mutation with web adapter
  return useUnfollow(username, {
    adapter,
  });
}
