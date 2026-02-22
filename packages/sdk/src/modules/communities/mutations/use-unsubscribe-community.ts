import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildUnsubscribeOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

/**
 * Payload for unsubscribing from a community.
 */
export interface UnsubscribeCommunityPayload {
  /** Community name (e.g., "hive-123456") */
  community: string;
}

/**
 * React Query mutation hook for unsubscribing from a community.
 *
 * This mutation broadcasts an unsubscribe operation to the Hive blockchain,
 * removing the community from the user's subscription list.
 *
 * @param username - The username unsubscribing (required for broadcast)
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
 * - Action: ["unsubscribe", {"community": "hive-123456"}]
 * - Authority: Posting key
 *
 * @example
 * ```typescript
 * const unsubscribeMutation = useUnsubscribeCommunity(username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Unsubscribe from a community
 * unsubscribeMutation.mutate({
 *   community: 'hive-123456'
 * });
 * ```
 */
export function useUnsubscribeCommunity(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<UnsubscribeCommunityPayload>(
    ["communities", "unsubscribe"],
    username,
    ({ community }) => [
      buildUnsubscribeOp(username!, community)
    ],
    async (_result: any, variables) => {
      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.accounts.subscriptions(username!),
          [...QueryKeys.communities.singlePrefix(variables.community)],
          QueryKeys.communities.context(username!, variables.community)
        ]);
      }
    },
    auth
  );
}
