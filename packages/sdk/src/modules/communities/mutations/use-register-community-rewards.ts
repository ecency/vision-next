import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildCommunityRegistrationOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

/**
 * Payload for community rewards registration.
 */
export interface CommunityRewardsRegisterPayload {
  /** Community account name (usually the community creator's account) */
  name: string;
}

/**
 * React Query mutation hook for registering to receive community rewards.
 *
 * This mutation broadcasts a custom_json operation to register a community
 * account to receive Ecency Points rewards for community activity.
 *
 * @param username - The username registering for community rewards (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Post-Broadcast Actions:**
 * - Invalidates community cache to update registration status
 * - Invalidates points balance to reflect potential initial rewards
 *
 * **Operation Details:**
 * - Uses custom_json operation with id "ecency_registration"
 * - JSON: {"name": "communityname"}
 * - Authority: Active key (required for registration)
 *
 * **Purpose:**
 * - Enables communities to receive Ecency Points for activity
 * - One-time registration per community
 * - Can only be done by the community owner/creator
 *
 * @example
 * ```typescript
 * const registerMutation = useRegisterCommunityRewards(username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Register community for rewards
 * registerMutation.mutate({
 *   name: 'hive-123456'
 * });
 * ```
 */
export function useRegisterCommunityRewards(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<CommunityRewardsRegisterPayload>(
    ["communities", "registerRewards"],
    username,
    ({ name }) => [
      buildCommunityRegistrationOp(name)
    ],
    async (_result: any, variables) => {
      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          // Invalidate community cache to update registration status
          [...QueryKeys.communities.singlePrefix(variables.name)],
          // Invalidate points balance
          [...QueryKeys.points._prefix(username!)],
        ]);
      }
    },
    auth,
    'active'
  );
}
