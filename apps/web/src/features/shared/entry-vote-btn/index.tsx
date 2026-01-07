"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import "./_index.scss";
import * as ss from "@/utils/session-storage";
import { LoginRequired } from "@/features/shared";
import useClickAway from "react-use/lib/useClickAway";
import { chevronUpSvgForVote } from "@ui/svg";
import { EntryVoteDialog } from "@/features/shared/entry-vote-btn/entry-vote-dialog";
import { useEntryVote } from "@/api/mutations";
import { Account, Entry, EntryVote } from "@/entities";
import { getEntryActiveVotesQueryOptions } from "@ecency/sdk";
import { prepareVotes } from "@/features/shared/entry-vote-btn/utils";
import { classNameObject } from "@ui/util";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { AnimatePresence, motion } from "framer-motion";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Props {
  entry: Entry;
  account?: Account;
  isPostSlider: boolean;
}

export function EntryVoteBtn({ entry: originalEntry, isPostSlider, account }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();

  const { data: entry } =
    useQuery(EcencyEntriesCacheManagement.getEntryQuery(originalEntry));

  const [dialog, setDialog] = useState(false);
  const [tipDialog, setTipDialog] = useState(false);
  const [previousVotedValue, setPreviousVotedValue] = useState<number>();

  const { mutateAsync: voteInAPI, isPending: isVotingLoading } = useEntryVote(entry);

  const isVoted = useMemo(() => {
    if (!activeUser) {
      return { upVoted: false, downVoted: false };
    }
    const upVoted =
      entry?.active_votes?.some(
        (v: EntryVote) => v.voter === activeUser.username && v.rshares >= 0
      ) ?? false;
    const downVoted =
      entry?.active_votes?.some(
        (v: EntryVote) => v.voter === activeUser.username && v.rshares < 0
      ) ?? false;

    return { upVoted, downVoted };
  }, [activeUser, entry?.active_votes]);

  useClickAway(rootRef, (e) => {
    if (!(e.target instanceof HTMLElement)) {
      return;
    }

    const target = e.target;

    // Ignore clicks inside the tipping modal container
    if (target.closest("#modal-dialog-container")) {
      return;
    }
    if (dialog) setDialog(false);
  });

  const vote = useCallback(
    async (percent: number, estimated: number) => {
      const weight = Math.ceil(percent * 100);

      await voteInAPI({ weight, estimated });

      setDialog(false);
    },
    [voteInAPI]
  );
  const getPreviousVote = useCallback(async () => {
    const { upVoted, downVoted } = isVoted;
    let previousVote;
    if (!activeUser || !entry) {
      return null;
    }

    if (upVoted || downVoted) {
      let username = activeUser?.username! + "-" + entry.post_id;
      let type = upVoted ? "up" : "down";
      let sessValue = ss.get(`vote-value-${type}-${username}`, null);

      if (sessValue !== null) {
        return sessValue;
      }

      try {
        const retData = await queryClient.fetchQuery(
          getEntryActiveVotesQueryOptions(entry)
        );
        let votes = prepareVotes(entry, retData);
        previousVote = votes.find((x) => x.voter === activeUser.username);
        return previousVote === undefined ? null : previousVote.percent;
      } catch (e) {
        console.error("entry-vote-btn failed to load previous vote", e);
        return null;
      }
    } else {
      return null;
    }
  }, [activeUser, entry, isVoted, queryClient]);
  const toggleDialog = useCallback(async () => {
    //if dialog is closing do nothing and close
    if (!dialog) {
      try {
        const preVote = await getPreviousVote();
        setPreviousVotedValue(preVote);
      } catch (e) {
        console.error("entry-vote-btn failed to toggle dialog", e);
        setPreviousVotedValue(undefined);
      }
    }

    setDialog(!dialog);
  }, [dialog, getPreviousVote]);

  return (
    <LoginRequired>
      <div ref={rootRef}>
        <div className="entry-vote-btn" onClick={toggleDialog}>
          <div
            className={classNameObject({
              "btn-vote btn-up-vote": true,
              "btn-vote voted": isVoted.downVoted || isVoted.upVoted,
              "btn-up-vote primary-btn-done": isVoted.upVoted,
              "btn-down-vote secondary-btn-done": isVoted.downVoted,
              "primary-btn secondary-btn": !isVoted.upVoted || !isVoted.downVoted
            })}
          >
            <div className="tooltip-vote">
              <span
                className={`btn-inner ${
                  dialog
                    ? isVoted.upVoted
                      ? "primary-btn-done"
                      : isVoted.downVoted
                        ? "secondary-btn-done"
                        : "primary-btn"
                    : ""
                }`}
              >
                {chevronUpSvgForVote}
              </span>
              <AnimatePresence>
                {dialog && entry && activeUser && (
                  <motion.div
                    key="vote-dialog"
                    initial={{
                      opacity: 0,
                      scale: 0.95
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.95
                    }}
                    className="tooltiptext"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EntryVoteDialog
                      account={account}
                      isPostSlider={isPostSlider}
                      upVoted={isVoted.upVoted}
                      downVoted={isVoted.downVoted}
                      previousVotedValue={previousVotedValue}
                      entry={entry}
                      setTipDialogMounted={(d) => setTipDialog(d)}
                      onClick={vote}
                      handleClickAway={() => setDialog(false)}
                      isVoted={isVoted}
                      isVotingLoading={isVotingLoading}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </LoginRequired>
  );
}
