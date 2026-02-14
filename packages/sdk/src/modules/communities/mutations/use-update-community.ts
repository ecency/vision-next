import { useBroadcastMutation, getQueryClient } from "@/modules/core";
import { buildUpdateCommunityOp, type CommunityProps } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";
import type { Community } from "../types";

/**
 * Payload for updating community properties.
 * Matches the CommunityProps interface from builders.
 */
export type UpdateCommunityPayload = CommunityProps;

/**
 * React Query mutation hook for updating community properties.
 *
 * This mutation broadcasts an updateProps operation to the Hive blockchain,
 * modifying the community's metadata and settings. Only community admins
 * can update community properties.
 *
 * @param community - Community name (e.g., "hive-123456")
 * @param username - The username updating the community (required for broadcast, must be admin)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Post-Broadcast Actions:**
 * - Invalidates community cache to refetch updated properties
 *
 * **Operation Details:**
 * - Uses custom_json operation with id "community"
 * - Action: ["updateProps", {"community": "hive-123456", "props": {...}}]
 * - Authority: Posting key
 *
 * **Properties:**
 * - title - Community display title
 * - about - Short description/tagline
 * - lang - Primary language code (e.g., "en")
 * - description - Full community description (markdown supported)
 * - flag_text - Custom text shown when flagging posts
 * - is_nsfw - Whether community contains NSFW content
 *
 * @example
 * ```typescript
 * const updateMutation = useUpdateCommunity('hive-123456', username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Update community properties
 * updateMutation.mutate({
 *   title: 'My Awesome Community',
 *   about: 'A place for awesome people',
 *   lang: 'en',
 *   description: '# Welcome\nThis is our community description',
 *   flag_text: 'Please explain why this content violates our rules',
 *   is_nsfw: false
 * });
 * ```
 */
export function useUpdateCommunity(
  community: string,
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<UpdateCommunityPayload>(
    ["communities", "update", community],
    username,
    (props) => [
      buildUpdateCommunityOp(username!, community, props)
    ],
    async (_result: any, variables) => {
      // Optimistic property merge in community cache
      const qc = getQueryClient();
      qc.setQueryData<Community>(
        ["community", "single", community],
        (prev) => {
          if (!prev) return prev;
          return { ...prev, ...(variables as unknown as Partial<Community>) };
        }
      );

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
