import { useBroadcastMutation } from "@/modules/core";
import { buildSubscribeOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

/**
 * Payload for subscribing to a community.
 */
export interface SubscribeCommunityPayload {
  /** Community name (e.g., "hive-123456") */
  community: string;
}

/**
 * React Query mutation hook for subscribing to a community.
 *
 * This mutation broadcasts a subscribe operation to the Hive blockchain,
 * adding the community to the user's subscription list.
 *
 * @param username - The username subscribing (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Post-Broadcast Actions:**
 * - Invalidates subscriptions cache to show updated subscription list
 * - Invalidates community cache to refetch updated subscriber count
 *
 * **Operation Details:**
 * - Uses custom_json operation with id "community"
 * - Action: ["subscribe", {"community": "hive-123456"}]
 * - Authority: Posting key
 *
 * @example
 * ```typescript
 * const subscribeMutation = useSubscribeCommunity(username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Subscribe to a community
 * subscribeMutation.mutate({
 *   community: 'hive-123456'
 * });
 * ```
 */
export function useSubscribeCommunity(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<SubscribeCommunityPayload>(
    ["communities", "subscribe"],
    username,
    ({ community }) => [
      buildSubscribeOp(username!, community)
    ],
    async (_result: any, variables) => {
      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["accounts", "subscriptions", username],
          ["communities", variables.community]
        ]);
      }
    },
    auth
  );
}
