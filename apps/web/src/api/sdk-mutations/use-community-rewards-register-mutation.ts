"use client";

import { useRegisterCommunityRewards, type CommunityRewardsRegisterPayload } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

/**
 * Web-specific community rewards registration mutation hook using SDK.
 *
 * Wraps the SDK's useRegisterCommunityRewards mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates community cache and points balance after registration
 *
 * @returns Mutation result with community rewards registration function from SDK
 *
 * @example
 * ```typescript
 * const RegisterButton = ({ communityName }) => {
 *   const { mutateAsync: register, isPending } = useCommunityRewardsRegisterMutation();
 *
 *   const handleRegister = async () => {
 *     try {
 *       await register({
 *         name: communityName
 *       });
 *       // Success! Community registered for rewards
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <button onClick={handleRegister} disabled={isPending}>Register for Rewards</button>;
 * };
 * ```
 */
export function useCommunityRewardsRegisterMutation() {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  // Create web broadcast adapter for SDK mutations
  const adapter = createWebBroadcastAdapter();

  // Use SDK's useRegisterCommunityRewards mutation with web adapter
  return useRegisterCommunityRewards(username, {
    adapter,
  });
}
