"use client";

import { Entry } from "@/entities";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useVoteMutation } from "@/api/sdk-mutations";
import { deriveOptimisticVote } from "./derive-optimistic-vote";

/**
 * Entry vote mutation hook.
 *
 * SDK handles: broadcast, optimistic SDK cache update, activity tracking, invalidation.
 * Web wrapper handles: web-specific cache key bridging + optimistic count/payout.
 */
export function useEntryVote(entry?: Entry | null) {
  const { activeUser } = useActiveAccount();

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

      // Optimistically reflect the vote on the web cache key. The unified waves
      // feed returns lightweight rows without an `active_votes` array, so gating
      // on it (the previous behavior) dropped the optimistic count/payout bump
      // for waves and fell back to a slow refetch. The SDK's deferred
      // invalidation reconciles the authoritative values afterwards.
      const { newVotes, nextVoteCount, nextPayout } = deriveOptimisticVote(
        entry,
        weight,
        estimated,
        activeUser.username
      );
      updateVotes(newVotes, nextPayout, nextVoteCount);
    },
  };
}
