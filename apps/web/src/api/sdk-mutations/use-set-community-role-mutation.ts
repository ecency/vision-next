"use client";

import { useSetCommunityRole, type SetCommunityRolePayload } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

/**
 * Web-specific set community role mutation hook using SDK.
 *
 * Wraps the SDK's useSetCommunityRole mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates community cache after setting role
 *
 * @param community - Community name (e.g., "hive-123456")
 *
 * @returns Mutation result with setRole function from SDK
 *
 * @example
 * ```typescript
 * const SetRoleButton = ({ community, user, role }) => {
 *   const { mutateAsync: setRole, isPending } = useSetCommunityRoleMutation(community);
 *
 *   const handleSetRole = async () => {
 *     try {
 *       await setRole({ account: user, role });
 *       // Success! Cache updated automatically by SDK
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <Button onClick={handleSetRole} disabled={isPending}>Set Role</Button>;
 * };
 * ```
 */
export function useSetCommunityRoleMutation(community: string) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  // Create web broadcast adapter for SDK mutations
  const adapter = createWebBroadcastAdapter();

  // Use SDK's useSetCommunityRole mutation with web adapter
  return useSetCommunityRole(community, username, {
    adapter,
  });
}
