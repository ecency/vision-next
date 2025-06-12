"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PollSnapshot } from "./polls-creation";
import { Button } from "@ui/button";
import { useGetPollDetailsQuery, useSignPollVoteByKey } from "../api";
import { PollOption } from "./poll-option";
import { PollOptionWithResults } from "./poll-option-with-results";
import { PollVotesListDialog } from "./poll-votes-list-dialog";
import { UilClock, UilPanelAdd } from "@tooni/iconscout-unicons-react";
import { format, isBefore, isDate, isValid } from "date-fns";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { FormControl } from "@ui/input";
import { useSet } from "react-use";
import { Entry } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import { PREFIX } from "@/utils/local-storage";
import { classNameObject } from "@ui/util";
import i18next from "i18next";

interface Props {
  poll: PollSnapshot;
  isReadOnly: boolean;
  entry?: Entry;
  compact?: boolean;
}

export function PollWidget({ poll, isReadOnly, entry, compact = false }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const pollDetails = useGetPollDetailsQuery(entry);
  const activeUserVote = useMemo(
    () => (pollDetails.data?.poll_voters ?? []).find((pv) => pv.name === activeUser?.username),
    [pollDetails.data?.poll_voters, activeUser?.username]
  );

  const { mutateAsync: vote, isPending: isVoting } = useSignPollVoteByKey(pollDetails.data);

  const [activeChoices, { add: addActiveChoice, remove: removeActiveChoice }] = useSet<string>();
  const [resultsMode, setResultsMode] = useState(false);
  const [isVotedAlready, setIsVotedAlready] = useState(false);
  const [showEndDate, setShowEndDate] = useLocalStorage(PREFIX + "_plls_set", false);
  const [interpretation, setInterpretation] =
    useState<PollSnapshot["interpretation"]>("number_of_votes");

  const endTimeFullDate = useMemo(
    () =>
      isDate(poll.endTime) && isValid(poll.endTime)
        ? format(poll.endTime, "dd.MM.yyyy HH:mm")
        : "Unset",
    [poll.endTime]
  );
  const isFinished = useMemo(() => isBefore(poll.endTime, new Date()), [poll.endTime]);
  const showViewVotes = useMemo(
    () => (!poll.hideVotes && !resultsMode) || activeUser?.username === entry?.author,
    [poll.hideVotes, resultsMode, activeUser?.username, entry?.author]
  );
  const showChangeVote = useMemo(
    () =>
      (poll.voteChange || !activeUserVote) && resultsMode && pollDetails.data?.status === "Active",
    [resultsMode, poll.voteChange, pollDetails.data?.status, activeUserVote]
  );
  const showVote = useMemo(
    () => pollDetails.data?.status === "Active" && !resultsMode && pollDetails.data?.poll_trx_id,
    [pollDetails.data?.status, resultsMode, pollDetails.data?.poll_trx_id]
  );
  const isInterpretationSelectionDisabled = useMemo(
    () => pollDetails.data?.poll_stats?.total_hive_hp_incl_proxied === null,
    [pollDetails.data?.poll_stats?.total_hive_hp_incl_proxied]
  );

  useEffect(() => {
    if (activeUserVote) {
      const choice = pollDetails.data?.poll_choices.find(
        (pc) => pc.choice_num === activeUserVote.choice_num
      );
      if (choice) {
        addActiveChoice(choice?.choice_text);
      }
    }
  }, [activeUserVote, addActiveChoice, pollDetails.data]);

  useEffect(() => {
    setResultsMode(isVotedAlready || isFinished);
  }, [isVotedAlready, isFinished]);

  useEffect(() => {
    setIsVotedAlready(!!activeUserVote);
  }, [activeUserVote]);

  useEffect(() => {
    if (isInterpretationSelectionDisabled) {
      setInterpretation("number_of_votes");
    } else {
      setInterpretation(
        (pollDetails.data?.preferred_interpretation ??
          "number_of_votes") as PollSnapshot["interpretation"]
      );
    }
  }, [pollDetails.data, isInterpretationSelectionDisabled]);

  useEffect(() => {
    if (!pollDetails.data?.poll_trx_id) {
      setTimeout(() => pollDetails.refetch(), 5000);
    }
  }, [pollDetails, pollDetails.data?.poll_trx_id]);

  return (
    <div className="grid grid-cols-4">
      <div
        className={classNameObject({
          "col-span-4 flex flex-col gap-4 border border-[--border-color] rounded-3xl p-4 dark:border-gray-900":
            true,
          "sm:col-span-3": !compact
        })}
      >
        {isReadOnly && (
          <div className="text-xs uppercase tracking-wide font-semibold opacity-50">
            {i18next.t("polls.preview-mode")}
          </div>
        )}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="font-semibold text-lg">{poll.title}</div>
          <div className="text-sm flex items-center gap-3 text-gray-600 py-1 min-h-[3rem] dark:text-gray-400 whitespace-nowrap">
            {showEndDate && (
              <>
                <div className="flex flex-col">
                  <span>
                    {isFinished ? i18next.t("polls.finished") : i18next.t("polls.end-time")}
                  </span>
                  <span className="text-blue-dark-sky font-semibold">{endTimeFullDate}</span>
                </div>
              </>
            )}
            <Button
              noPadding={true}
              icon={<UilClock />}
              onClick={() => setShowEndDate(!showEndDate)}
              appearance="gray-link"
            />
          </div>
        </div>
        {poll.filters.accountAge > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {i18next.t("polls.account-age-hint", { n: poll.filters.accountAge })}
          </div>
        )}
        {!resultsMode && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {i18next.t("polls.max-votes-hint", { n: poll.maxChoicesVoted ?? 1 })}
          </div>
        )}
        <div className="flex flex-col gap-3">
          {poll.choices.map((choice) =>
            resultsMode ? (
              <PollOptionWithResults
                interpretation={interpretation}
                key={choice}
                entry={entry}
                choice={choice}
                activeChoices={activeChoices}
              />
            ) : (
              <PollOption
                choice={choice}
                key={choice}
                addActiveChoice={(v) => {
                  if (activeChoices.size < (pollDetails.data?.max_choices_voted ?? 1)) {
                    addActiveChoice(v);
                  }
                }}
                removeActiveChoice={removeActiveChoice}
                activeChoices={activeChoices}
              />
            )
          )}
          {resultsMode &&
            activeUser?.username === entry?.author &&
            !isInterpretationSelectionDisabled && (
              <div className="flex items-center gap-2 flex-wrap">
                <div>{i18next.t("polls.interpretation")}</div>
                <FormControl
                  full={false}
                  type="select"
                  size="xs"
                  value={interpretation}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setInterpretation(e.target.value as PollSnapshot["interpretation"])
                  }
                >
                  <option value="number_of_votes">{i18next.t("polls.number_of_votes")}</option>
                  <option value="tokens">{i18next.t("polls.tokens")}</option>
                </FormControl>
              </div>
            )}
        </div>
        {showVote && (
          <Button
            disabled={isReadOnly || activeChoices.size === 0 || isVoting}
            icon={<UilPanelAdd />}
            iconPlacement="left"
            size="lg"
            className="font-semibold text-sm px-4 mt-4"
            onClick={() => {
              setIsVotedAlready(false);
              vote({ choices: activeChoices!! });
            }}
          >
            {i18next.t(isVoting ? "polls.voting" : "polls.vote")}
          </Button>
        )}
        {pollDetails.data && !pollDetails.data.poll_trx_id && !isReadOnly && (
          <Button size="sm" disabled={true}>
            {i18next.t("polls.creating-in-progress")}
          </Button>
        )}
        {showChangeVote && (
          <Button appearance="link" size="sm" onClick={() => setResultsMode(false)}>
            {i18next.t("polls.back-to-vote")}
          </Button>
        )}
        {!resultsMode && (
          <Button appearance="link" size="sm" onClick={() => setResultsMode(true)}>
            {i18next.t("polls.view-votes")}
          </Button>
        )}
        {resultsMode && showViewVotes && <PollVotesListDialog entry={entry} />}
      </div>
    </div>
  );
}
