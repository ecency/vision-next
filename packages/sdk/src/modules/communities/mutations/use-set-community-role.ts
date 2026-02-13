import { useBroadcastMutation } from "@/modules/core";
import { buildSetRoleOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

/**
 * Payload for setting a user's role in a community.
 */
export interface SetCommunityRolePayload {
  /** Account to set role for */
  account: string;
  /** Role name (e.g., "admin", "mod", "member", "guest") */
  role: string;
}

/**
 * React Query mutation hook for setting a user's role in a community.
 *
 * This mutation broadcasts a setRole operation to the Hive blockchain,
 * updating the role of a community member. Only users with appropriate
 * permissions (community owner/admin) can set roles.
 *
 * @param community - Community name (e.g., "hive-123456")
 * @param username - The username setting the role (required for broadcast, must have permission)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Post-Broadcast Actions:**
 * - Invalidates community cache to refetch updated team member list
 *
 * **Operation Details:**
 * - Uses custom_json operation with id "community"
 * - Action: ["setRole", {"community": "hive-123456", "account": "user", "role": "mod"}]
 * - Authority: Posting key
 *
 * **Role Types:**
 * - "owner" - Community owner (full permissions)
 * - "admin" - Administrator (can manage settings and team)
 * - "mod" - Moderator (can mute posts/users)
 * - "member" - Regular member (no special permissions)
 * - "guest" - Remove user from team (empty string also works)
 *
 * @example
 * ```typescript
 * const setRoleMutation = useSetCommunityRole('hive-123456', username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Set a user as moderator
 * setRoleMutation.mutate({
 *   account: 'alice',
 *   role: 'mod'
 * });
 *
 * // Remove a user from the team
 * setRoleMutation.mutate({
 *   account: 'bob',
 *   role: 'guest'
 * });
 * ```
 */
export function useSetCommunityRole(
  community: string,
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<SetCommunityRolePayload>(
    ["communities", "set-role", community],
    username,
    ({ account, role }) => [
      buildSetRoleOp(username!, community, account, role)
    ],
    async (_result: any, _variables) => {
      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["community", community]
        ]);
      }
    },
    auth
  );
}
