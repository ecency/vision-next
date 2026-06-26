"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import "./_index.scss";
import * as ss from "@/utils/session-storage";
import { LoginRequired } from "@/features/shared";
import useClickAway from "react-use/lib/useClickAway";
import { chevronUpSvgForVote } from "@ui/svg";
import dynamic from "next/dynamic";
import { useEntryVote } from "@/api/mutations";
import { Account, Entry, EntryVote } from "@/entities";
import { getEntryActiveVotesQueryOptions } from "@ecency/sdk";
import { prepareVotes } from "@/features/shared/entry-vote-btn/utils";
import { classNameObject } from "@ui/util";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { AnimatePresence, motion } from "framer-motion";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { error } from "@/features/shared/feedback";
import { formatError } from "@/api/format-error";
import i18next from "i18next";

// The vote slider dialog only mounts on interaction (dialog && entry &&
// activeUser, below) — never SSR-meaningful. Lazy-load it so it doesn't ship
// in the post page's first client chunk. Mirrors entry-votes/index.tsx.
const EntryVoteDialog = dynamic(
  () =>
    import("@/features/shared/entry-vote-btn/entry-vote-dialog").then((m) => ({
      default: m.EntryVoteDialog
    })),
  { ssr: false }
);

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

      try {
        await voteInAPI({ weight, estimated });
        // Close only on success — on failure keep the slider open so the user
        // can adjust and retry in place (matches the pre-existing behavior).
        setDialog(false);
      } catch (e) {
        // The broadcast was rejected (commonly the account is out of Resource
        // Credits, or an identical/duplicate vote). Surface the friendly,
        // classified toast via the standard error()/formatError path instead of
        // letting the rejection escape as an unhandled promise — which Sentry's
        // global handler would otherwise capture as a fresh client crash.
        error(...formatError(e));
      }
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
  const toggleDialog = useCallback(() => {
    // Closing: just close.
    if (dialog) {
      setDialog(false);
      return;
    }

    // Opening: open the slider immediately so the tap paints without waiting on
    // getPreviousVote(), which can do a network fetch for the user's prior vote
    // on an already-voted post (session-cache miss). Awaiting it here used to
    // block the dialog open and inflate INP on that interaction. The dialog
    // syncs to the resolved value reactively once it arrives (see the
    // previousVotedValue effect in entry-vote-dialog).
    setDialog(true);
    getPreviousVote()
      .then((preVote) => setPreviousVotedValue(preVote ?? undefined))
      .catch((e) => {
        console.error("entry-vote-btn failed to load previous vote", e);
        setPreviousVotedValue(undefined);
      });
  }, [dialog, getPreviousVote]);

  return (
    <LoginRequired promptOnAnon>
      <div ref={rootRef}>
        <div
          className="entry-vote-btn"
          role="button"
          tabIndex={0}
          aria-label={
            isVoted.upVoted
              ? i18next.t("entry-vote-btn.upvoted", { defaultValue: "Upvoted, edit vote" })
              : isVoted.downVoted
                ? i18next.t("entry-vote-btn.downvoted", { defaultValue: "Downvoted, edit vote" })
                : i18next.t("entry-vote-btn.vote", { defaultValue: "Vote" })
          }
          aria-pressed={isVoted.upVoted || isVoted.downVoted}
          aria-expanded={dialog}
          aria-haspopup="dialog"
          onClick={toggleDialog}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleDialog();
            }
          }}
        >
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
