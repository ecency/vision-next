import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatError, proposalVote } from "@/api/operations";
import { Operation, PrivateKey } from "@hiveio/dhive";
import { client as hiveClient } from "@/api/hive";
import { useGlobalStore } from "@/core/global-store";
import * as keychain from "@/utils/keychain";
import { error } from "@/features/shared";
import { QueryIdentifiers } from "@/core/react-query";
import { ProposalVote } from "@/entities";

export function useProposalVoteByKey(proposalId: number) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["proposalVote", proposalId],
    mutationFn: ({ key, approve }: { key: PrivateKey; approve?: boolean }) => {
      const op: Operation = [
        "update_proposal_votes",
        {
          voter: activeUser?.username,
          proposal_ids: [proposalId],
          approve,
          extensions: []
        }
      ];

      return hiveClient.broadcast.sendOperations([op], key);
    },
    onSuccess: () => {
      queryClient.setQueryData<InfiniteData<ProposalVote[]>>(
        [QueryIdentifiers.PROPOSAL_VOTES, proposalId, activeUser?.username, 1],
        (data) => {
          if (!data) {
            return data;
          }

          return {
            pages: [
              [
                {
                  id: 1,
                  voter: activeUser?.username ?? ""
                }
              ]
            ],
            pageParams: [""]
          };
        }
      );
    },
    onError: (e) => error(...formatError(e))
  });
}

export function useProposalVoteByKeychain(proposalId: number) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  return useMutation({
    mutationKey: ["proposalVoteByKeychain", proposalId],
    mutationFn: ({ approve }: { approve?: boolean }) => {
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

      return keychain.broadcast(activeUser.username, [op], "Active");
    },
    onError: (e) => error(...formatError(e))
  });
}
