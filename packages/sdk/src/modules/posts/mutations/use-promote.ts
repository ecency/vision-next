import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildPromoteOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

/**
 * Payload for promoting a post using Ecency Points.
 */
export interface PromotePayload {
  /** Post author */
  author: string;
  /** Post permlink */
  permlink: string;
  /** Promotion duration in days */
  duration: number;
}

/**
 * React Query mutation hook for promoting posts.
 *
 * This mutation broadcasts a custom_json operation to promote a post
 * using Ecency Points. The post will appear in promoted feeds for the
 * specified duration.
 *
 * @param username - The username promoting the post (required for broadcast, deducts points from this user)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Post-Broadcast Actions:**
 * - Invalidates promoted posts cache to show newly promoted content
 * - Invalidates user points balance
 * - Invalidates post cache to update promotion status
 *
 * **Operation Details:**
 * - Uses custom_json operation with id "ecency_promote"
 * - JSON: {"user": "username", "author": "postauthor", "permlink": "postpermlink", "duration": 7}
 * - Authority: Active key (required for point spending)
 *
 * **Cost:**
 * - Costs Ecency Points based on duration
 * - User must have sufficient points balance
 *
 * @example
 * ```typescript
 * const promoteMutation = usePromote(username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Promote a post for 7 days
 * promoteMutation.mutate({
 *   author: 'alice',
 *   permlink: 'my-great-post',
 *   duration: 7
 * });
 * ```
 */
export function usePromote(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<PromotePayload>(
    ["ecency", "promote"],
    username,
    ({ author, permlink, duration }) => [
      buildPromoteOp(username!, author, permlink, duration)
    ],
    async (_result: any, variables) => {
      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          // Invalidate promoted posts feed
          [...QueryKeys.posts._promotedPrefix],
          // Invalidate user points balance
          [...QueryKeys.points._prefix(username!)],
          // Invalidate specific post cache to update promotion status
          QueryKeys.posts.entry(`/@${variables.author}/${variables.permlink}`),
        ]);
      }
    },
    auth,
    'active'
  );
}
