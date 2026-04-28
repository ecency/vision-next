import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetPollDetailsQuery } from "./get-poll-details-query";
import { PollsVotesManagement } from "./polls-votes-management";
import { error } from "@/features/shared";
import i18next from "i18next";
import { QueryKeys, usePollVote, type Poll } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { formatError } from "@/api/format-error";

export function useSignPollVoteByKey(poll: ReturnType<typeof useGetPollDetailsQuery>["data"]) {
  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();
  const adapter = getWebBroadcastAdapter();

  const { mutateAsync: broadcastPollVote } = usePollVote(activeUser?.username, { adapter });

  return useMutation({
    mutationKey: QueryKeys.polls.vote(poll?.author, poll?.permlink),
    mutationFn: async ({ choices }: { choices: Set<string> }) => {
      // Throw (not return) on validation failures so mutateAsync rejects and
      // onError runs — that's the single place that surfaces the toast.
      if (!poll || !activeUser) {
        throw new Error(i18next.t("polls.not-found"));
      }

      const choiceNums =
        poll.poll_choices
          ?.filter((pc) => choices.has(pc.choice_text))
          ?.map((i) => i.choice_num) ?? [];
      if (choiceNums.length === 0) {
        throw new Error(i18next.t("polls.not-found"));
      }

      await broadcastPollVote({ pollTrxId: poll.poll_trx_id, choices: choiceNums });

      return { choiceNums };
    },
    onSuccess: (resp) =>
      queryClient.setQueryData<Poll>(
        QueryKeys.polls.details(poll?.author ?? "", poll?.permlink ?? ""),
        (data) => {
          if (!data || !resp) {
            return data;
          }

          return PollsVotesManagement.processVoting(activeUser, data, resp.choiceNums);
        }
      ),
    onError: (e) => error(...formatError(e))
  });
}
