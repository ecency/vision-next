"use client";

/**
 * Legacy proposal vote mutations (migrated to SDK).
 *
 * This file maintains backwards compatibility with existing components.
 * Both hooks now delegate to the SDK-based mutation.
 *
 * Migration: proposal-vote -> SDK useProposalVote
 * - SDK mutation: packages/sdk/src/modules/proposals/mutations/use-proposal-vote.ts
 * - Web wrapper: apps/web/src/api/sdk-mutations/use-proposal-vote-mutation.ts
 */

import { useMutation } from "@tanstack/react-query";
import { useProposalVoteMutation } from "@/api/sdk-mutations";
import { PrivateKey } from "@hiveio/dhive";

/**
 * Legacy hook for voting on proposals with private key.
 * Now delegates to SDK-based mutation.
 *
 * @deprecated Use `useProposalVoteMutation(proposalId)` directly instead.
 */
export function useProposalVoteByKey(proposalId: number) {
  const { mutateAsync: proposalVote, isPending } = useProposalVoteMutation(proposalId);

  return useMutation({
    mutationKey: ["proposalVote", proposalId],
    mutationFn: async ({ key, approve }: { key: PrivateKey; approve?: boolean }) => {
      // Note: The SDK mutation wrapper handles all auth methods via adapter
      // The "key" parameter is ignored - auth method is determined by adapter's fallback chain
      return proposalVote({ approve: approve ?? false });
    },
    // isPending state is already tracked by inner mutation
    meta: { isPending }
  });
}

/**
 * Legacy hook for voting on proposals with Keychain.
 * Now delegates to SDK-based mutation.
 *
 * @deprecated Use `useProposalVoteMutation(proposalId)` directly instead.
 */
export function useProposalVoteByKeychain(proposalId: number) {
  const { mutateAsync: proposalVote, isPending } = useProposalVoteMutation(proposalId);

  return useMutation({
    mutationKey: ["proposalVoteByKeychain", proposalId],
    mutationFn: async ({ approve }: { approve?: boolean }) => {
      // Note: The SDK mutation wrapper handles all auth methods via adapter
      // Auth method is determined by adapter's fallback chain
      return proposalVote({ approve: approve ?? false });
    },
    // isPending state is already tracked by inner mutation
    meta: { isPending }
  });
}
