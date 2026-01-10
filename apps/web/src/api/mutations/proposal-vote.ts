"use client";

import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatError } from "@/api/operations";
import { Operation, PrivateKey } from "@hiveio/dhive";
import { CONFIG } from "@ecency/sdk";
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

      return [
        approve ?? false,
        await CONFIG.hiveClient.broadcast.sendOperations([op], key)
      ] as const;
    },
    onSuccess: ([approve]) => {
      // Optimistically update the UI immediately for instant feedback
      queryClient.setQueryData<InfiniteData<ProposalVote[]>>(
        [QueryIdentifiers.PROPOSAL_VOTES, proposalId, activeUser?.username, 1],
        (data) => {
          if (!data) {
            return {
              pages: [
                approve
                  ? [{ id: 1, voter: activeUser?.username ?? "" }]
                  : []
              ],
              pageParams: [""]
            };
          }

          return {
            ...data,
            pages: [
              approve
                ? [{ id: 1, voter: activeUser?.username ?? "" }]
                : []
            ]
          };
        }
      );

      // Invalidate after delay to refetch actual blockchain state
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [QueryIdentifiers.PROPOSAL_VOTES, proposalId, activeUser?.username, 1]
        });
      }, 3500); // 3.5 seconds - enough time for block confirmation
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

      return [
        approve ?? false,
        await keychain.broadcast(activeUser.username, [op], "Active")
      ] as const;
    },
    onSuccess: ([approve]) => {
      // Optimistically update the UI immediately for instant feedback
      queryClient.setQueryData<InfiniteData<ProposalVote[]>>(
        [QueryIdentifiers.PROPOSAL_VOTES, proposalId, activeUser?.username, 1],
        (data) => {
          if (!data) {
            return {
              pages: [
                approve
                  ? [{ id: 1, voter: activeUser?.username ?? "" }]
                  : []
              ],
              pageParams: [""]
            };
          }

          return {
            ...data,
            pages: [
              approve
                ? [{ id: 1, voter: activeUser?.username ?? "" }]
                : []
            ]
          };
        }
      );

      // Invalidate after delay to refetch actual blockchain state
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [QueryIdentifiers.PROPOSAL_VOTES, proposalId, activeUser?.username, 1]
        });
      }, 3500); // 3.5 seconds - enough time for block confirmation
    },
    onError: (e) => error(...formatError(e))
  });
}
