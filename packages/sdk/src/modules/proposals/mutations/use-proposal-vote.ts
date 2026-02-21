import { useBroadcastMutation, QueryKeys } from "@/modules/core";
import { buildProposalVoteOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

/**
 * Payload for voting on proposals.
 */
export interface ProposalVotePayload {
  /** Array of proposal IDs to vote on */
  proposalIds: number[];
  /** True to approve, false to disapprove */
  approve: boolean;
}

/**
 * React Query mutation hook for voting on Hive proposals.
 *
 * This mutation broadcasts an update_proposal_votes operation to vote on
 * one or more proposals in the Hive Decentralized Fund (HDF).
 *
 * @param username - The username voting on proposals (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Post-Broadcast Actions:**
 * - Records activity (type 150) if adapter.recordActivity is available
 * - Invalidates proposal list cache to show updated vote status
 * - Invalidates voter's proposal votes cache
 *
 * **Multiple Proposals:**
 * - You can vote on multiple proposals in a single transaction
 * - All proposals receive the same vote (approve or disapprove)
 * - Proposal IDs are integers, not strings
 *
 * **Vote Types:**
 * - approve: true - Vote in favor of the proposal(s)
 * - approve: false - Remove your vote from the proposal(s)
 *
 * @example
 * ```typescript
 * const proposalVoteMutation = useProposalVote(username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Approve a single proposal
 * proposalVoteMutation.mutate({
 *   proposalIds: [123],
 *   approve: true
 * });
 *
 * // Approve multiple proposals
 * proposalVoteMutation.mutate({
 *   proposalIds: [123, 124, 125],
 *   approve: true
 * });
 *
 * // Remove vote from a proposal
 * proposalVoteMutation.mutate({
 *   proposalIds: [123],
 *   approve: false
 * });
 * ```
 */
export function useProposalVote(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<ProposalVotePayload>(
    ["proposals", "vote"],
    username,
    ({ proposalIds, approve }) => [
      buildProposalVoteOp(username!, proposalIds, approve)
    ],
    async (result: any) => {
      // Wrap post-broadcast side-effects in try-catch to prevent propagating errors
      try {
        // Activity tracking (fire-and-forget — non-critical, shouldn't block mutation completion)
        if (auth?.adapter?.recordActivity && result?.block_num && result?.id) {
          auth.adapter.recordActivity(150, result.block_num, result.id).catch(() => {});
        }

        // Cache invalidation
        if (auth?.adapter?.invalidateQueries) {
          await auth.adapter.invalidateQueries([
            QueryKeys.proposals.list(),
            QueryKeys.proposals.votesByUser(username!)
          ]);
        }
      } catch (error) {
        // Log but don't rethrow - don't fail mutation due to side-effect errors
        console.warn('[useProposalVote] Post-broadcast side-effect failed:', error);
      }
    },
    auth,
    'active' // Use active authority for proposal votes (required by blockchain)
  );
}
