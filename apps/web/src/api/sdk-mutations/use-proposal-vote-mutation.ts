"use client";

import { QueryKeys, useProposalVote, getUserProposalVotesQueryOptions } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Web-specific proposal vote mutation hook using SDK.
 *
 * Wraps the SDK's useProposalVote mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Polls blockchain for confirmation (preserves UX from legacy mutation)
 * - Automatically invalidates proposal votes cache after vote
 * - Uses update_proposal_votes operation with active authority
 *
 * @param proposalId - Proposal ID to vote on
 * @returns Mutation result with vote function and polling logic
 *
 * @example
 * ```typescript
 * const ProposalVoteButton = ({ proposalId }: { proposalId: number }) => {
 *   const { mutateAsync: vote, isPending } = useProposalVoteMutation(proposalId);
 *
 *   const handleVote = async (voted: boolean) => {
 *     try {
 *       await vote({ approve: !voted });
 *       // Success! Vote confirmed on blockchain
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <Button onClick={() => handleVote(voted)} disabled={isPending}>Vote</Button>;
 * };
 * ```
 *
 * @remarks
 * **Polling Logic:**
 * - After broadcast, polls blockchain up to 5 times (3s intervals per Hive block time)
 * - Confirms vote by checking user's proposal votes
 * - Keeps loading state active until blockchain confirms or timeout
 *
 * **Vote Types:**
 * - approve: true - Vote in favor of the proposal
 * - approve: false - Remove your vote from the proposal
 *
 * **Authentication:**
 * - Uses active authority (update_proposal_votes operation)
 * - Supports all auth methods via web broadcast adapter
 * - Automatically falls back through auth chain if needed
 *
 * **Cache Management:**
 * - SDK automatically invalidates caches during polling
 * - Web layer adds additional invalidation for specific proposal votes
 */
export function useProposalVoteMutation(proposalId: number) {
  const username = useActiveUsername();
  const queryClient = useQueryClient();

  // Get shared web broadcast adapter singleton for SDK mutations
  const adapter = getWebBroadcastAdapter();

  // Use SDK's useProposalVote mutation with web adapter
  const { mutateAsync: proposalVote } = useProposalVote(username, { adapter });

  // Wrap with polling logic (web-specific UX)
  return useMutation({
    mutationKey: ["proposalVote", proposalId],
    mutationFn: async ({ approve }: { approve: boolean }) => {
      if (!username) {
        throw new Error("[ProposalVote] – no active user");
      }

      // Broadcast transaction via SDK
      await proposalVote({ proposalIds: [proposalId], approve });

      const proposalVotesPrefix = QueryKeys.proposals.votes(proposalId, "", 0).slice(0, 3);
      const userVotesKey = QueryKeys.proposals.votesByUser(username);

      // Poll for blockchain confirmation to keep loading state active.
      // Polling failures should not fail the mutation after a successful broadcast.
      try {
        for (let attempts = 0; attempts <= 5; attempts++) {
          if (attempts >= 5) {
            // After 5 attempts (~15 seconds), give up and invalidate all queries.
            await queryClient.invalidateQueries({
              queryKey: proposalVotesPrefix
            });
            await queryClient.invalidateQueries({
              queryKey: userVotesKey
            });
            break;
          }

          // Wait 3 seconds between polls (Hive block time).
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Invalidate cache first to force fresh fetch.
          await queryClient.invalidateQueries({
            queryKey: userVotesKey
          });

          // Fetch fresh user's proposal votes to check if vote is confirmed.
          const userVotes = await queryClient.fetchQuery(
            getUserProposalVotesQueryOptions(username)
          );

          const hasVote = userVotes.some(vote => vote.proposal?.proposal_id === proposalId);

          // Check if vote state matches what we expect.
          if ((approve && hasVote) || (!approve && !hasVote)) {
            // Vote confirmed! Invalidate all relevant queries to ensure UI updates.
            await queryClient.invalidateQueries({
              queryKey: proposalVotesPrefix
            });
            await queryClient.invalidateQueries({
              queryKey: userVotesKey
            });
            break;
          }
        }
      } catch {
        // Best-effort refresh; do not fail successful broadcasts on polling errors.
        await queryClient.invalidateQueries({
          queryKey: proposalVotesPrefix
        });
        await queryClient.invalidateQueries({
          queryKey: userVotesKey
        });
      }

      return approve;
    }
  });
}
