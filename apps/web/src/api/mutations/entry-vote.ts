import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Entry } from "@/entities";
import { formatError, vote } from "@/api/operations";
import { error } from "@/features/shared";
import { QueryIdentifiers } from "@/core/react-query";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useEntryVote(entry?: Entry) {
  const { activeUser } = useActiveAccount();

  const { invalidate } = EcencyEntriesCacheManagement.useInvalidation(entry);
  const { update: updateVotes } = EcencyEntriesCacheManagement.useUpdateVotes(entry);
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["entryVote", entry?.author, entry?.permlink],
    mutationFn: async ({ weight, estimated }: { weight: number; estimated: number }) => {
      if (!entry) {
        throw new Error("Entry not provided");
      }

      if (!activeUser) {
        throw new Error("Active user not provided");
      }

      await vote(activeUser?.username, entry.author, entry.permlink, weight);

      return [
        estimated,
        [
          ...(entry.active_votes
            ? entry.active_votes.filter((x) => x.voter !== activeUser?.username)
            : []),
          { rshares: weight, voter: activeUser?.username }
        ]
      ] as const;
    },
    onSuccess: ([estimated, votes]) => {
      // Invalidate account query to refresh voting power
      qc.invalidateQueries({
        queryKey: [QueryIdentifiers.ACCOUNT_FULL, activeUser?.username]
      });

      if (!entry) {
        throw new Error("No entry provided");
      }

      const newPayout = entry.payout + estimated;
      if (entry.active_votes) {
        updateVotes([...votes], newPayout);
      } else {
        invalidate();
      }

      qc.invalidateQueries({
        queryKey: [QueryIdentifiers.ENTRY_ACTIVE_VOTES, entry!.author, entry!.permlink]
      });
    },
    onError: (e) => error(...formatError(e))
  });
}
