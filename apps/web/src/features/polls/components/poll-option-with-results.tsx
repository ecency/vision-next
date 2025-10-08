import React, { useMemo } from "react";
import { PollCheck } from "./poll-option";
import { useGetPollDetailsQuery } from "../api";
import { PollSnapshot } from "./polls-creation";
import { Entry } from "@/entities";
import { classNameObject } from "@ui/util";
import i18next from "i18next";

export interface Props {
  activeChoices: Set<string>;
  choice: string;
  entry?: Entry;
  interpretation: PollSnapshot["interpretation"];
}

export function PollOptionWithResults({ choice, activeChoices, entry, interpretation }: Props) {
  const pollDetails = useGetPollDetailsQuery(entry);

  const votesCount = useMemo(
    () =>
      pollDetails.data?.poll_choices.find((pc) => pc.choice_text === choice)?.votes?.total_votes ??
      0,
    [choice, pollDetails.data?.poll_choices]
  );
  const totalVotes = useMemo(
    () => Math.max(pollDetails.data?.poll_stats?.total_voting_accounts_num ?? 0, 1),
    [pollDetails.data?.poll_stats?.total_voting_accounts_num]
  );
  const totalHp = useMemo(
    () => pollDetails.data?.poll_stats?.total_hive_hp_incl_proxied ?? 0,
    [pollDetails.data?.poll_stats?.total_hive_hp_incl_proxied]
  );
  const choiceHp = useMemo(
    () =>
      pollDetails.data?.poll_choices.find((pc) => pc.choice_text === choice)?.votes
        ?.hive_hp_incl_proxied ?? 0,
    [pollDetails.data?.poll_choices, choice]
  );

  const progress = useMemo(() => {
    if (interpretation === "tokens") {
      return ((choiceHp * 100) / totalHp).toFixed(2);
    }

    return ((votesCount * 100) / totalVotes).toFixed(2);
  }, [totalHp, choiceHp, votesCount, totalVotes, interpretation]);

  return (
    <div
      className={classNameObject({
        "min-h-[52px] relative overflow-hidden flex items-center gap-4 duration-300 cursor-pointer text-sm px-4 py-3 rounded-2xl":
          true,
        "bg-gray-200 dark:bg-dark-200": true
      })}
    >
      <div
        className={classNameObject({
          "bg-blue-dark-sky bg-opacity-50 min-h-[52px] absolute top-0 left-0 bottom-0": true
        })}
        style={{
          width: `${progress}%`
        }}
      />
      {activeChoices.has(choice) && <PollCheck checked={activeChoices.has(choice)} />}
      <div className="flex w-full gap-2 justify-between">
        <span>{choice}</span>
        <span className="text-xs whitespace-nowrap">
          {progress}% (
          {interpretation === "number_of_votes"
            ? `${votesCount} ${i18next.t("polls.votes")}`
            : choiceHp.toFixed(2)}
          )
        </span>
      </div>
    </div>
  );
}
