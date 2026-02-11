"use client";

import { Entry } from "@/entities";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useVoteMutation } from "@/api/sdk-mutations";

/**
 * Entry vote mutation hook with optimistic updates.
 *
 * Wraps SDK's useVoteMutation with entry-specific cache management:
 * - Optimistically updates vote UI before confirmation
 * - Updates entry payout estimate
 * - Invalidates entry cache on success
 *
 * SDK already handles:
 * - Broadcasting vote operation
 * - Invalidating account query (voting power)
 * - Recording user activity
 * - Error notifications via adapter
 *
 * @param entry - Entry to vote on
 * @returns Mutation with custom mutateAsync that accepts weight and estimated payout
 */
export function useEntryVote(entry?: Entry | null) {
  const { activeUser } = useActiveAccount();

  const { invalidate } = EcencyEntriesCacheManagement.useInvalidation(entry);
  const { update: updateVotes } = EcencyEntriesCacheManagement.useUpdateVotes(entry);

  // Use SDK mutation for broadcasting
  const sdkMutation = useVoteMutation();

  // Wrap SDK mutation to add entry-specific logic
  return {
    ...sdkMutation,
    mutateAsync: async ({ weight, estimated }: { weight: number; estimated: number }) => {
      if (!entry) {
        throw new Error("Entry not provided");
      }

      if (!activeUser) {
        throw new Error("Active user not provided");
      }

      // Broadcast vote via SDK
      await sdkMutation.mutateAsync({
        author: entry.author,
        permlink: entry.permlink,
        weight,
      });

      // Optimistically update votes in cache
      const newVotes = [
        ...(entry.active_votes
          ? entry.active_votes.filter((x) => x.voter !== activeUser?.username)
          : []),
        { rshares: weight, voter: activeUser?.username }
      ];

      const newPayout = entry.payout + estimated;

      if (entry.active_votes) {
        updateVotes(newVotes, newPayout);
      } else {
        invalidate();
      }

      // Note: SDK already invalidates account query and entry active votes
      // No need to manually invalidate those queries here
    },
  };
}
