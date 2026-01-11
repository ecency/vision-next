"use client";

import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatError } from "@/api/operations";
import { Operation, PrivateKey } from "@hiveio/dhive";
import { CONFIG, getProposalVotesInfiniteQueryOptions } from "@ecency/sdk";
import * as keychain from "@/utils/keychain";
import { error } from "@/features/shared";
import { QueryIdentifiers } from "@/core/react-query";
import { ProposalVote } from "@/entities";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useProposalVoteByKey(proposalId: number) {
  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["proposalVote", proposalId],
    mutationFn: async ({ key, approve }: { key: PrivateKey; approve?: boolean }) => {
      const op: Operation = [
        "update_proposal_votes",
        {
          voter: activeUser?.username,
          proposal_ids: [proposalId],
          approve,
          extensions: []
        }
      ];

      // Broadcast transaction
      await CONFIG.hiveClient.broadcast.sendOperations([op], key);

      // Poll for blockchain confirmation to keep loading state active
      const pollForConfirmation = async (attempts = 0): Promise<void> => {
        if (attempts >= 5) {
          // After 5 attempts (~15 seconds), give up and invalidate
          await queryClient.invalidateQueries({
            queryKey: [QueryIdentifiers.PROPOSAL_VOTES, proposalId, activeUser?.username, 1]
          });
          return;
        }

        // Wait 3 seconds between polls (Hive block time)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Refetch to get fresh data from blockchain and wait for it
        await queryClient.refetchQueries({
          queryKey: [QueryIdentifiers.PROPOSAL_VOTES, proposalId, activeUser?.username, 1],
          type: 'active'
        });

        // Small delay to ensure cache is updated
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get the fresh data from cache after refetch
        const result = queryClient.getQueryData<InfiniteData<ProposalVote[]>>(
          [QueryIdentifiers.PROPOSAL_VOTES, proposalId, activeUser?.username, 1]
        );

        const votes = result?.pages?.[0] ?? [];
        const hasVote = votes.some(v => v.voter === activeUser?.username);

        console.log(`[Proposal Vote Poll] Attempt ${attempts + 1}, approve: ${approve}, hasVote: ${hasVote}, votes:`, votes);

        // Check if vote state matches what we expect
        if ((approve && hasVote) || (!approve && !hasVote)) {
          // Vote confirmed! Invalidate one more time to ensure UI updates
          await queryClient.invalidateQueries({
            queryKey: [QueryIdentifiers.PROPOSAL_VOTES, proposalId, activeUser?.username, 1]
          });
          return;
        } else {
          // Not confirmed yet, poll again
          await pollForConfirmation(attempts + 1);
        }
      };

      await pollForConfirmation();

      return approve ?? false;
    },
    onSuccess: () => {
      // Data already invalidated during polling when confirmed
    },
    onError: (e) => error(...formatError(e))
  });
}

export function useProposalVoteByKeychain(proposalId: number) {
  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["proposalVoteByKeychain", proposalId],
    mutationFn: async ({ approve }: { approve?: boolean }) => {
      if (!activeUser) {
        throw new Error("Active user not found");
      }

      const op: Operation = [
        "update_proposal_votes",
        {
          voter: activeUser.username,
          proposal_ids: [proposalId],
          approve,
          extensions: []
        }
      ];

      // Broadcast transaction
      await keychain.broadcast(activeUser.username, [op], "Active");

      // Poll for blockchain confirmation to keep loading state active
      const pollForConfirmation = async (attempts = 0): Promise<void> => {
        if (attempts >= 5) {
          // After 5 attempts (~15 seconds), give up and invalidate
          await queryClient.invalidateQueries({
            queryKey: [QueryIdentifiers.PROPOSAL_VOTES, proposalId, activeUser?.username, 1]
          });
          return;
        }

        // Wait 3 seconds between polls (Hive block time)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Refetch to get fresh data from blockchain and wait for it
        await queryClient.refetchQueries({
          queryKey: [QueryIdentifiers.PROPOSAL_VOTES, proposalId, activeUser?.username, 1],
          type: 'active'
        });

        // Small delay to ensure cache is updated
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get the fresh data from cache after refetch
        const result = queryClient.getQueryData<InfiniteData<ProposalVote[]>>(
          [QueryIdentifiers.PROPOSAL_VOTES, proposalId, activeUser?.username, 1]
        );

        const votes = result?.pages?.[0] ?? [];
        const hasVote = votes.some(v => v.voter === activeUser?.username);

        console.log(`[Proposal Vote Poll] Attempt ${attempts + 1}, approve: ${approve}, hasVote: ${hasVote}, votes:`, votes);

        // Check if vote state matches what we expect
        if ((approve && hasVote) || (!approve && !hasVote)) {
          // Vote confirmed! Invalidate one more time to ensure UI updates
          await queryClient.invalidateQueries({
            queryKey: [QueryIdentifiers.PROPOSAL_VOTES, proposalId, activeUser?.username, 1]
          });
          return;
        } else {
          // Not confirmed yet, poll again
          await pollForConfirmation(attempts + 1);
        }
      };

      await pollForConfirmation();

      return approve ?? false;
    },
    onSuccess: () => {
      // Data already invalidated during polling when confirmed
    },
    onError: (e) => error(...formatError(e))
  });
}
