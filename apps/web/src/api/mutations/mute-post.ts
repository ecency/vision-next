"use client";

import { useMutation } from "@tanstack/react-query";
import { Community, Entry } from "@/entities";
import { formatError } from "@/api/operations";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error } from "@/features/shared";
import { useMutePostMutation } from "@/api/sdk-mutations";

/**
 * Entry-specific mute post mutation hook that wraps SDK mute post with web app cache management.
 *
 * This hook provides:
 * - SDK-based mute post mutation (authentication, broadcasting)
 * - Web app-specific cache updates (community posts, post cache, feed cache)
 * - User feedback (error messages)
 *
 * @param entry - The entry to mute/unmute
 * @param community - The community the entry belongs to
 * @returns Mutation result with mute post function
 *
 * @example
 * ```typescript
 * const { mutate: mutePost, isPending } = useMutePost(entry, community);
 * mutePost({ notes: 'Spam', mute: true }); // Mute
 * mutePost({ notes: 'Resolved', mute: false }); // Unmute
 * ```
 */
export function useMutePost(entry: Entry, community: Community) {
  const { activeUser } = useActiveAccount();
  const { mutateAsync: sdkMutePost } = useMutePostMutation();

  return useMutation({
    mutationKey: ["mutePost", entry?.author, entry?.permlink],
    mutationFn: async ({ notes, mute }: { notes: string; mute: boolean }) => {
      // Use SDK mute post mutation
      await sdkMutePost({
        community: community.name,
        author: entry.author,
        permlink: entry.permlink,
        notes,
        mute,
      });
    },
    onError: (err) => error(...formatError(err)),
  });
}
