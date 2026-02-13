"use client";

import { useWitnessVote } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { QueryIdentifiers } from "@/core/react-query";

/**
 * Web-specific witness vote mutation hook using SDK.
 *
 * Wraps the SDK's useWitnessVote mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Polls blockchain for confirmation (preserves UX from legacy mutation)
 * - Automatically invalidates witness votes and account cache after vote
 * - Uses account_witness_vote operation with active authority
 *
 * @param witness - Witness account name to vote for
 * @returns Mutation result with vote function and polling logic
 *
 * @example
 * ```typescript
 * const WitnessVoteButton = ({ witness }: { witness: string }) => {
 *   const { mutateAsync: vote, isPending } = useWitnessVoteMutation(witness);
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
 * - Confirms vote by checking account's witness_votes array
 * - Keeps loading state active until blockchain confirms or timeout
 *
 * **Vote Types:**
 * - approve: true - Vote for the witness
 * - approve: false - Remove your vote from the witness
 *
 * **Authentication:**
 * - Uses active authority (account_witness_vote operation)
 * - Supports all auth methods via web broadcast adapter
 * - Automatically falls back through auth chain if needed
 *
 * **Cache Management:**
 * - SDK automatically invalidates caches during polling
 * - Web layer adds additional invalidation for witness votes cache
 */
export function useWitnessVoteMutation(witness: string) {
  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();
  const username = activeUser?.username;

  // Create web broadcast adapter for SDK mutations
  const adapter = createWebBroadcastAdapter();

  // Use SDK's useWitnessVote mutation with web adapter
  const { mutateAsync: witnessVote } = useWitnessVote(username, { adapter });

  // Wrap with polling logic (web-specific UX)
  return useMutation({
    mutationKey: ["vote-witness", username, witness],
    mutationFn: async ({ approve }: { approve: boolean }) => {
      if (!username) {
        throw new Error("[VoteWitness] – no active user");
      }

      // Broadcast transaction via SDK
      await witnessVote({ witness, approve });

      // Poll for blockchain confirmation to keep loading state active
      const pollForConfirmation = async (attempts = 0): Promise<void> => {
        if (attempts >= 5) {
          // After 5 attempts (~15 seconds), give up
          return;
        }

        // Wait 3 seconds between polls (Hive block time)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Fetch fresh account data from blockchain
        const account = await queryClient.fetchQuery(
          getAccountFullQueryOptions(username)
        );

        const witnessVotes = account?.witness_votes ?? [];
        const hasVote = witnessVotes.includes(witness);

        // Check if vote state matches what we expect
        if ((approve && hasVote) || (!approve && !hasVote)) {
          // Vote confirmed!
          return;
        } else {
          // Not confirmed yet, poll again
          await pollForConfirmation(attempts + 1);
        }
      };

      await pollForConfirmation();

      return approve;
    },
    onSuccess: async () => {
      // Invalidate to refresh UI with confirmed data
      await queryClient.invalidateQueries({
        queryKey: ["accounts", username]
      });
      await queryClient.invalidateQueries({
        queryKey: [QueryIdentifiers.WITNESSES_VOTES, username, "votes"]
      });
    }
  });
}
