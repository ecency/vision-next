import { useBroadcastMutation } from "@/modules/core";
import { buildUnfollowOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

/**
 * Payload for unfollowing an account.
 */
export interface UnfollowPayload {
  /** Account to unfollow */
  following: string;
}

/**
 * React Query mutation hook for unfollowing an account.
 *
 * This mutation broadcasts an unfollow operation to the Hive blockchain,
 * removing the target account from the follower's follow list.
 *
 * @param username - The username of the follower (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Post-Broadcast Actions:**
 * - Invalidates relationship cache to show updated follow status
 * - Invalidates account cache to refetch updated follower/following counts
 *
 * @example
 * ```typescript
 * const unfollowMutation = useUnfollow(username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Unfollow an account
 * unfollowMutation.mutate({
 *   following: 'alice'
 * });
 * ```
 */
export function useUnfollow(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<UnfollowPayload>(
    ["accounts", "unfollow"],
    username,
    ({ following }) => [
      buildUnfollowOp(username!, following)
    ],
    async (_result: any, variables) => {
      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["accounts", "relations", username, variables.following],
          ["accounts", "full", variables.following]
        ]);
      }
    },
    auth
  );
}
