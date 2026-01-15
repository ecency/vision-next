"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { witnessVote, witnessVoteHot, witnessVoteKc } from "@/api/operations";
import { PrivateKey } from "@hiveio/dhive";
import { QueryIdentifiers } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";

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

      // Broadcast transaction
      switch (payload.kind) {
        case "app":
          await witnessVote(activeUser.username, payload.key, witness, approve);
          break;
        case "hot":
          await witnessVoteHot(activeUser.username, witness, approve);
          break;
        case "kc":
          await witnessVoteKc(activeUser.username, witness, approve);
          break;
        default:
          throw new Error("[VoteWitness] – not known vote kind");
      }

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
          getAccountFullQueryOptions(activeUser.username)
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
    onSuccess: async (approve) => {
      // Invalidate to refresh UI with confirmed data
      await queryClient.invalidateQueries({
        queryKey: ["accounts", activeUser?.username]
      });
      await queryClient.invalidateQueries({
        queryKey: [QueryIdentifiers.WITNESSES_VOTES, activeUser?.username, "votes"]
      });
    }
  });
}
