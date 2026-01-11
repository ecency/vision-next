"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatError } from "@/api/operations";
import { Operation, PrivateKey } from "@hiveio/dhive";
import { CONFIG, getUserProposalVotesQueryOptions } from "@ecency/sdk";
import * as keychain from "@/utils/keychain";
import { error } from "@/features/shared";
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
          // After 5 attempts (~15 seconds), give up and invalidate all queries
          await queryClient.invalidateQueries({
            queryKey: ["proposals", "votes", proposalId]
          });
          await queryClient.invalidateQueries({
            queryKey: ["proposals", "votes", "by-user", activeUser?.username]
          });
          return;
        }

        // Wait 3 seconds between polls (Hive block time)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Invalidate cache first to force fresh fetch
        await queryClient.invalidateQueries({
          queryKey: ["proposals", "votes", "by-user", activeUser?.username]
        });

        // Fetch fresh user's proposal votes to check if vote is confirmed
        const userVotes = await queryClient.fetchQuery(
          getUserProposalVotesQueryOptions(activeUser?.username ?? "")
        );

        const hasVote = userVotes.some(vote => vote.proposal.proposal_id === proposalId);

        // Check if vote state matches what we expect
        if ((approve && hasVote) || (!approve && !hasVote)) {
          // Vote confirmed! Invalidate all relevant queries to ensure UI updates
          await queryClient.invalidateQueries({
            queryKey: ["proposals", "votes", proposalId]
          });
          await queryClient.invalidateQueries({
            queryKey: ["proposals", "votes", "by-user", activeUser?.username]
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
          // After 5 attempts (~15 seconds), give up and invalidate all queries
          await queryClient.invalidateQueries({
            queryKey: ["proposals", "votes", proposalId]
          });
          await queryClient.invalidateQueries({
            queryKey: ["proposals", "votes", "by-user", activeUser?.username]
          });
          return;
        }

        // Wait 3 seconds between polls (Hive block time)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Invalidate cache first to force fresh fetch
        await queryClient.invalidateQueries({
          queryKey: ["proposals", "votes", "by-user", activeUser?.username]
        });

        // Fetch fresh user's proposal votes to check if vote is confirmed
        const userVotes = await queryClient.fetchQuery(
          getUserProposalVotesQueryOptions(activeUser?.username ?? "")
        );

        const hasVote = userVotes.some(vote => vote.proposal.proposal_id === proposalId);

        // Check if vote state matches what we expect
        if ((approve && hasVote) || (!approve && !hasVote)) {
          // Vote confirmed! Invalidate all relevant queries to ensure UI updates
          await queryClient.invalidateQueries({
            queryKey: ["proposals", "votes", proposalId]
          });
          await queryClient.invalidateQueries({
            queryKey: ["proposals", "votes", "by-user", activeUser?.username]
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
