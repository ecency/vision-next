import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildMutePostOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

/**
 * Payload for muting/unmuting a post in a community.
 */
export interface MutePostPayload {
  /** Community name (e.g., "hive-123456") */
  community: string;
  /** Post author */
  author: string;
  /** Post permlink */
  permlink: string;
  /** Mute reason/notes (required even for unmute) */
  notes: string;
  /** True to mute, false to unmute */
  mute: boolean;
}

/**
 * React Query mutation hook for muting/unmuting posts in a community.
 *
 * This mutation broadcasts a custom_json operation to mute (or unmute)
 * a post within a community. Only community moderators/admins can mute posts.
 *
 * @param username - The username performing the mute (required for broadcast, must have permission)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Post-Broadcast Actions:**
 * - Invalidates community posts cache to hide muted content
 * - Invalidates post cache to update mute status
 * - Invalidates feed cache to remove muted posts from feeds
 *
 * **Operation Details:**
 * - Uses custom_json operation with id "community"
 * - Action: ["mutePost", {"community": "hive-123456", "account": "author", "permlink": "post", "notes": "reason"}]
 * - Action (unmute): ["unmutePost", {"community": "hive-123456", "account": "author", "permlink": "post", "notes": "reason"}]
 * - Authority: Posting key
 *
 * **Mute vs Unmute:**
 * - mute: true - Mutes the post (hides from community feed)
 * - mute: false - Unmutes the post (restores to community feed)
 *
 * **Permission:**
 * - Only community moderators and admins can mute/unmute posts
 * - Attempting to mute without permission will fail with an error
 *
 * @example
 * ```typescript
 * const mutePostMutation = useMutePost(username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Mute a post
 * mutePostMutation.mutate({
 *   community: 'hive-123456',
 *   author: 'alice',
 *   permlink: 'my-post',
 *   notes: 'Violates community guidelines',
 *   mute: true
 * });
 *
 * // Unmute a post
 * mutePostMutation.mutate({
 *   community: 'hive-123456',
 *   author: 'alice',
 *   permlink: 'my-post',
 *   notes: 'Resolved after editing',
 *   mute: false
 * });
 * ```
 */
export function useMutePost(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<MutePostPayload>(
    ["communities", "mutePost"],
    username,
    ({ community, author, permlink, notes, mute }) => [
      buildMutePostOp(username!, community, author, permlink, notes, mute)
    ],
    async (_result: any, variables) => {
      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        const queriesToInvalidate: any[] = [
          // Invalidate specific post cache to update mute status
          QueryKeys.posts.entry(`/@${variables.author}/${variables.permlink}`),
          // Invalidate community data
          ["community", "single", variables.community],
          // Invalidate community feed/posts (matches all sort orders, limits, observers)
          {
            predicate: (query: any) => {
              const key = query.queryKey;
              return (
                Array.isArray(key) &&
                key[0] === "posts" &&
                key[1] === "posts-ranked" &&
                key[3] === variables.community
              );
            }
          }
        ];
        await auth.adapter.invalidateQueries(queriesToInvalidate);
      }
    },
    auth
  );
}
