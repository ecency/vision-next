"use client";

import { useProposalVote, getUserProposalVotesQueryOptions } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
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
  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();
  const username = activeUser?.username;

  // Create web broadcast adapter for SDK mutations
  const adapter = createWebBroadcastAdapter();

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

      // Poll for blockchain confirmation to keep loading state active
      const pollForConfirmation = async (attempts = 0): Promise<void> => {
        if (attempts >= 5) {
          // After 5 attempts (~15 seconds), give up and invalidate all queries
          await queryClient.invalidateQueries({
            queryKey: ["proposals", "votes", proposalId]
          });
          await queryClient.invalidateQueries({
            queryKey: ["proposals", "votes", "by-user", username]
          });
          return;
        }

        // Wait 3 seconds between polls (Hive block time)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Invalidate cache first to force fresh fetch
        await queryClient.invalidateQueries({
          queryKey: ["proposals", "votes", "by-user", username]
        });

        // Fetch fresh user's proposal votes to check if vote is confirmed
        const userVotes = await queryClient.fetchQuery(
          getUserProposalVotesQueryOptions(username)
        );

        const hasVote = userVotes.some(vote => vote.proposal?.proposal_id === proposalId);

        // Check if vote state matches what we expect
        if ((approve && hasVote) || (!approve && !hasVote)) {
          // Vote confirmed! Invalidate all relevant queries to ensure UI updates
          await queryClient.invalidateQueries({
            queryKey: ["proposals", "votes", proposalId]
          });
          await queryClient.invalidateQueries({
            queryKey: ["proposals", "votes", "by-user", username]
          });
          return;
        } else {
          // Not confirmed yet, poll again
          await pollForConfirmation(attempts + 1);
        }
      };

      await pollForConfirmation();

      return approve;
    },
    onSuccess: () => {
      // Data already invalidated during polling when confirmed
    }
  });
}
