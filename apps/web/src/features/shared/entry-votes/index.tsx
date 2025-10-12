"use client";

import React, { ReactNode, useMemo, useState } from "react";
import "./_index.scss";
import { Entry } from "@/entities";
import { Tooltip } from "@ui/tooltip";
import i18next from "i18next";
import { heartSvg } from "@ui/svg";
import usePrevious from "react-use/lib/usePrevious";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { EntryVotesDialog } from "@/features/shared/entry-votes/entry-votes-dialog";
import {useClientActiveUser} from "@/api/queries";

type SortOption = "reward" | "timestamp" | "voter" | "percent";

interface Props {
  entry: Entry;
  icon?: ReactNode;
  hideCount?: boolean;
}

export function EntryVotes({ entry: initialEntry, icon, hideCount = false }: Props) {
  const { data: entry } = EcencyEntriesCacheManagement.getEntryQuery(initialEntry).useClientQuery();
  const previousEntry = usePrevious(entry);

  const activeUser = useClientActiveUser();

  const [visible, setVisible] = useState(false);

  const { voted: isVoted } = useMemo(() => {
    if (!activeUser) {
      return { voted: false };
    }
    const { active_votes: votes } = entry!;

    const voted = votes ? votes.some((v) => v.voter === activeUser.username) : false;

    return { voted };
  }, [activeUser, entry]);

  const totalVotes = useMemo(
    () =>
      entry?.stats?.total_votes ||
      (entry?.active_votes && entry?.active_votes?.length) ||
      entry?.total_votes ||
      0,
    [entry]
  );
  const title = useMemo(
    () =>
      totalVotes === 0
        ? i18next.t("entry-votes.title-empty")
        : totalVotes === 1
          ? i18next.t("entry-votes.title")
          : i18next.t("entry-votes.title-n", { n: totalVotes }),
    [totalVotes]
  );
  const hasDifferentVotes = previousEntry?.active_votes?.length !== entry?.active_votes?.length;
  const hasCurrentUserVote = entry?.active_votes?.find(
    ({ voter }) => voter === activeUser?.username
  );

  const countClassName = `entry-votes__count${hideCount ? " entry-votes__count--hidden" : ""}`;

  const child = (
    <>
      <div
        className={`heart-icon ${isVoted ? "voted" : ""} ${
          hasDifferentVotes && hasCurrentUserVote ? "vote-done" : ""
        } `}
      >
        {icon ?? heartSvg}
      </div>
      <span className={countClassName} aria-hidden={hideCount}>
        {totalVotes}
      </span>
    </>
  );

  if (totalVotes === 0) {
    return (
      <div className="entry-votes notranslate">
        <Tooltip content={title}>
          <span className="inner-btn no-data">{child}</span>
        </Tooltip>
      </div>
    );
  }

  return (
    <>
      <div className="entry-votes notranslate">
        <Tooltip content={title}>
          <span className="inner-btn" onClick={() => setVisible(!visible)}>
            {child}
          </span>
        </Tooltip>
      </div>
      {visible && (
        <EntryVotesDialog
          hasDifferentVotes={hasDifferentVotes}
          totalVotes={totalVotes}
          entry={entry}
          onHide={() => setVisible(false)}
        />
      )}
    </>
  );
}
