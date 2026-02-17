"use client";

import { useWitnessVote, getAccountFullQueryOptions, QueryKeys } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";

export function useWitnessVoteMutation(witness: string) {
  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();
  const username = activeUser?.username;

  const adapter = createWebBroadcastAdapter();
  const { mutateAsync: witnessVote } = useWitnessVote(username, { adapter });

  const witnessVotesKey = [QueryIdentifiers.WITNESSES_VOTES, username, "votes"];

  return useMutation({
    mutationKey: ["vote-witness", username, witness],
    mutationFn: async ({ approve }: { approve: boolean }) => {
      if (!username) {
        throw new Error("[VoteWitness] – no active user");
      }

      await witnessVote({ witness, approve });

      // Poll for blockchain confirmation
      const pollForConfirmation = async (attempts = 0): Promise<void> => {
        if (attempts >= 5) return;

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Invalidate account cache to force fresh fetch
        await queryClient.invalidateQueries({ queryKey: QueryKeys.accounts.full(username) });

        const account = await queryClient.fetchQuery(
          getAccountFullQueryOptions(username)
        );

        const witnessVotes = account?.witness_votes ?? [];
        const hasVote = witnessVotes.includes(witness);

        if ((approve && hasVote) || (!approve && !hasVote)) {
          // Confirmed — update witness votes cache with real data
          queryClient.setQueryData(witnessVotesKey, witnessVotes);
          return;
        }

        await pollForConfirmation(attempts + 1);
      };

      await pollForConfirmation();
      return approve;
    },
    onMutate: async ({ approve }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: witnessVotesKey });

      // Snapshot previous value
      const previousVotes = queryClient.getQueryData<string[]>(witnessVotesKey);

      // Optimistically update witness votes
      queryClient.setQueryData<string[]>(witnessVotesKey, (old) => {
        const votes = old ?? [];
        if (approve) {
          return votes.includes(witness) ? votes : [...votes, witness];
        }
        return votes.filter((v) => v !== witness);
      });

      return { previousVotes };
    },
    onError: (_err, _vars, context) => {
      // Roll back on error
      if (context?.previousVotes) {
        queryClient.setQueryData(witnessVotesKey, context.previousVotes);
      }
    },
    onSettled: async () => {
      // Always invalidate to ensure consistency
      await queryClient.invalidateQueries({ queryKey: witnessVotesKey });
      await queryClient.invalidateQueries({ queryKey: QueryKeys.accounts.full(username) });
    }
  });
}
