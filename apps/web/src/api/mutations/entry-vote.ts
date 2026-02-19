"use client";

import { Entry } from "@/entities";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useVoteMutation } from "@/api/sdk-mutations";

/**
 * Entry vote mutation hook.
 *
 * SDK handles: broadcast, optimistic SDK cache update, activity tracking, invalidation.
 * Web wrapper handles: web-specific cache key bridging.
 */
export function useEntryVote(entry?: Entry | null) {
  const { activeUser } = useActiveAccount();

  const { invalidate } = EcencyEntriesCacheManagement.useInvalidation(entry);
  const { update: updateVotes } = EcencyEntriesCacheManagement.useUpdateVotes(entry);

  const sdkMutation = useVoteMutation();

  return {
    ...sdkMutation,
    mutate: undefined,
    mutateAsync: async ({ weight, estimated }: { weight: number; estimated: number }) => {
      if (!entry) throw new Error("Entry not provided");
      if (!activeUser) throw new Error("Active user not provided");

      // Broadcast vote via SDK (SDK updates its own cache optimistically)
      await sdkMutation.mutateAsync({
        author: entry.author,
        permlink: entry.permlink,
        weight,
        estimated,
      });

      // Bridge: update web-specific cache key
      if (entry.active_votes) {
        const newVotes = [
          ...entry.active_votes.filter((x) => x.voter !== activeUser.username),
          ...(weight !== 0 ? [{ rshares: weight, voter: activeUser.username }] : [])
        ];
        updateVotes(newVotes, entry.payout + estimated);
      } else {
        invalidate();
      }
    },
  };
}
