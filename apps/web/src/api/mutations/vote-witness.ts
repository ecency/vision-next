"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { witnessVote, witnessVoteHot, witnessVoteKc } from "@/api/operations";
import { PrivateKey } from "@hiveio/dhive";
import { QueryIdentifiers } from "@/core/react-query";

interface KindOfPayload<T extends string> {
  kind: T;
  voted: boolean;
}

interface PayloadApp extends KindOfPayload<"app"> {
  key: PrivateKey;
}

type Payload = KindOfPayload<"hot"> | KindOfPayload<"kc"> | PayloadApp;

export function useVoteWitness(witness: string) {
  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["vote-witness", activeUser?.username, witness],
    mutationFn: async (payload: Payload) => {
      const approve = !payload.voted;

      if (!activeUser) {
        throw new Error("[VoteWitness] – no active user");
      }

      switch (payload.kind) {
        case "app":
          await witnessVote(activeUser!!.username, payload.key, witness, approve);
          return payload;
        case "hot":
          return witnessVoteHot(activeUser!!.username, witness, approve);
        case "kc":
          await witnessVoteKc(activeUser!!.username, witness, approve);
          return payload;
        default:
          throw new Error("[VoteWitness] – not known vote kind");
      }
    },
    onSuccess: (payload) => {
      if (!payload) {
        return;
      }

      // Optimistically update the UI immediately for instant feedback
      if (payload.voted) {
        queryClient.setQueryData<string[]>(
          [QueryIdentifiers.WITNESSES_VOTES, activeUser?.username, "votes"],
          (data) => (data ?? []).filter((wv) => wv !== witness)
        );
      } else {
        queryClient.setQueryData<string[]>(
          [QueryIdentifiers.WITNESSES_VOTES, activeUser?.username, "votes"],
          (data) => [...(data ?? []), witness]
        );
      }

      // Invalidate after delay to refetch actual blockchain state
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [QueryIdentifiers.WITNESSES_VOTES, activeUser?.username, "votes"]
        });
        queryClient.invalidateQueries({
          queryKey: ["accounts", activeUser?.username]
        });
      }, 3500); // 3.5 seconds - enough time for block confirmation
    }
  });
}
