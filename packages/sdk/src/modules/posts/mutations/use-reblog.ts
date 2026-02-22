import { useBroadcastMutation, QueryKeys, getQueryClient } from "@/modules/core";
import { buildReblogOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";
import { EntriesCacheManagement } from "../cache/entries-cache-management";

/**
 * Payload for reblogging a post.
 */
export interface ReblogPayload {
  /** Original post author */
  author: string;
  /** Original post permlink */
  permlink: string;
  /** If true, removes the reblog instead of creating it */
  deleteReblog?: boolean;
}

/**
 * React Query mutation hook for reblogging posts.
 *
 * This mutation broadcasts a custom_json operation to reblog (or un-reblog)
 * a post to the user's blog feed.
 *
 * @param username - The username performing the reblog (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Post-Broadcast Actions:**
 * - Records activity (type 130) if adapter.recordActivity is available
 * - Invalidates blog feed cache to show the reblogged post
 * - Invalidates post cache to update reblog status
 *
 * **Reblog vs Delete:**
 * - deleteReblog: false (default) - Creates a reblog
 * - deleteReblog: true - Removes an existing reblog
 *
 * @example
 * ```typescript
 * const reblogMutation = useReblog(username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Reblog a post
 * reblogMutation.mutate({
 *   author: 'alice',
 *   permlink: 'my-awesome-post'
 * });
 *
 * // Remove a reblog
 * reblogMutation.mutate({
 *   author: 'alice',
 *   permlink: 'my-awesome-post',
 *   deleteReblog: true
 * });
 * ```
 */
export function useReblog(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<ReblogPayload>(
    ["posts", "reblog"],
    username,
    ({ author, permlink, deleteReblog }) => [
      buildReblogOp(username!, author, permlink, deleteReblog ?? false)
    ],
    async (result: any, variables) => {
      // Optimistic reblog count update
      const entry = EntriesCacheManagement.getEntry(variables.author, variables.permlink);
      if (entry) {
        const newCount = Math.max(0, (entry.reblogs ?? 0) + (variables.deleteReblog ? -1 : 1));
        EntriesCacheManagement.updateReblogsCount(variables.author, variables.permlink, newCount);
      }

      // Activity tracking (fire-and-forget — non-critical, shouldn't block mutation completion)
      if (auth?.adapter?.recordActivity && result?.block_num && result?.id) {
        auth.adapter.recordActivity(130, result.block_num, result.id).catch(() => {});
      }

      // Invalidate user's blog feed so reblogged post appears/disappears
      const qc = getQueryClient();
      qc.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key[0] === "posts" &&
            key[1] === "account-posts" &&
            key[2] === username &&
            key[3] === "blog"
          );
        }
      });

      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.posts.entry(`/@${variables.author}/${variables.permlink}`),
          QueryKeys.posts.rebloggedBy(variables.author, variables.permlink),
        ]);
      }
    },
    auth
  );
}
