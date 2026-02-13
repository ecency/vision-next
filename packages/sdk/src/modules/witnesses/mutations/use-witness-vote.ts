import { useBroadcastMutation } from "@/modules/core";
import { buildWitnessVoteOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

/**
 * Payload for voting for a witness.
 */
export interface WitnessVotePayload {
  /** Witness account name to vote for/against */
  witness: string;
  /** True to approve, false to disapprove */
  approve: boolean;
}

/**
 * React Query mutation hook for voting for a Hive witness.
 *
 * This mutation broadcasts an account_witness_vote operation to vote for
 * or remove a vote from a witness.
 *
 * @param username - The username voting for the witness (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Post-Broadcast Actions:**
 * - Invalidates account data cache to show updated witness votes
 * - Invalidates witness votes cache
 *
 * **Vote Types:**
 * - approve: true - Vote for the witness
 * - approve: false - Remove your vote from the witness
 *
 * **Authority Required:**
 * - Active authority is required for witness voting
 *
 * @example
 * ```typescript
 * const witnessVoteMutation = useWitnessVote(username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Vote for a witness
 * witnessVoteMutation.mutate({
 *   witness: 'good-karma',
 *   approve: true
 * });
 *
 * // Remove vote from a witness
 * witnessVoteMutation.mutate({
 *   witness: 'good-karma',
 *   approve: false
 * });
 * ```
 */
export function useWitnessVote(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<WitnessVotePayload>(
    ["witnesses", "vote"],
    username,
    ({ witness, approve }) => [
      buildWitnessVoteOp(username!, witness, approve)
    ],
    async () => {
      // Wrap post-broadcast side-effects in try-catch to prevent propagating errors
      try {
        // Cache invalidation
        if (auth?.adapter?.invalidateQueries) {
          await auth.adapter.invalidateQueries([
            ["accounts", username],
            ["witnesses", "votes", username]
          ]);
        }
      } catch (error) {
        // Log but don't rethrow - don't fail mutation due to side-effect errors
        console.warn('[useWitnessVote] Post-broadcast side-effect failed:', error);
      }
    },
    auth,
    'active' // Use active authority for witness votes (required by blockchain)
  );
}
