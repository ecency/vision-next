import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildFollowOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

/**
 * Payload for following an account.
 */
export interface FollowPayload {
  /** Account to follow */
  following: string;
}

/**
 * React Query mutation hook for following an account.
 *
 * This mutation broadcasts a follow operation to the Hive blockchain,
 * adding the target account to the follower's "blog" follow list.
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
 * const followMutation = useFollow(username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Follow an account
 * followMutation.mutate({
 *   following: 'alice'
 * });
 * ```
 */
export function useFollow(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<FollowPayload>(
    ["accounts", "follow"],
    username,
    ({ following }) => [
      buildFollowOp(username!, following)
    ],
    async (_result: any, variables) => {
      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.accounts.relations(username!, variables.following),
          ["accounts", "full", variables.following]
        ]);
      }
    },
    auth
  );
}
