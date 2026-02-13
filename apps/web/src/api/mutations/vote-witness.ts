"use client";

/**
 * Legacy witness vote mutation (migrated to SDK).
 *
 * This file maintains backwards compatibility with KeyOrHotDialog.
 * The payload format is converted to SDK format internally.
 *
 * Migration: vote-witness -> SDK useWitnessVote
 * - SDK mutation: packages/sdk/src/modules/witnesses/mutations/use-witness-vote.ts
 * - Web wrapper: apps/web/src/api/sdk-mutations/use-witness-vote-mutation.ts
 */

import { useMutation } from "@tanstack/react-query";
import { useWitnessVoteMutation } from "@/api/sdk-mutations";
import { PrivateKey } from "@hiveio/dhive";

interface KindOfPayload<T extends string> {
  kind: T;
  voted: boolean;
}

interface PayloadApp extends KindOfPayload<"app"> {
  key: PrivateKey;
}

type Payload = KindOfPayload<"hot"> | KindOfPayload<"kc"> | PayloadApp;

/**
 * Legacy hook that accepts old payload format for backwards compatibility.
 * Converts old format to SDK format and delegates to SDK mutation.
 *
 * Old usage (still supported):
 * ```ts
 * const { mutateAsync: vote } = useVoteWitness(witness);
 * await vote({ kind: "app", key, voted });
 * await vote({ kind: "hot", voted });
 * await vote({ kind: "kc", voted });
 * ```
 */
export function useVoteWitness(witness: string) {
  const { mutateAsync: voteWitness, isPending } = useWitnessVoteMutation(witness);

  return useMutation({
    mutationKey: ["vote-witness-legacy", witness],
    mutationFn: async (payload: Payload) => {
      const approve = !payload.voted;

      // Note: The SDK mutation wrapper handles all auth methods via adapter
      // The "kind" field is ignored - auth method is determined by adapter's fallback chain
      return voteWitness({ approve });
    },
    // isPending state is already tracked by inner mutation
    meta: { isPending }
  });
}
