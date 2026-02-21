"use client";

import { useVote, type VotePayload } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

/**
 * Web-specific vote mutation hook using SDK.
 *
 * Wraps the SDK's useVote mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates post cache after voting
 * - Records user activity points
 *
 * @returns Mutation result with vote function from SDK
 *
 * @example
 * ```typescript
 * const VoteButton = ({ author, permlink }) => {
 *   const { mutateAsync: vote, isPending } = useVoteMutation();
 *
 *   const handleVote = async (weight: number) => {
 *     try {
 *       await vote({ author, permlink, weight });
 *       // Success! Cache updated automatically by SDK
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <VoteButton onClick={() => handleVote(10000)} disabled={isPending} />;
 * };
 * ```
 */
export function useVoteMutation() {
  const username = useActiveUsername();

  // Create web broadcast adapter for SDK mutations
  const adapter = getWebBroadcastAdapter();

  // Use SDK's useVote mutation with web adapter
  return useVote(username, {
    adapter,
  });
}
