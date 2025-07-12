"use client";

import React, { ReactNode, useMemo, useState } from "react";
import "./_index.scss";
import { Entry } from "@/entities";
import { Tooltip } from "@ui/tooltip";
import i18next from "i18next";
import { heartSvg } from "@ui/svg";
import usePrevious from "react-use/lib/usePrevious";
import { EntryVotesDialog } from "@/features/shared/entry-votes/entry-votes-dialog";
import { useClientActiveUser } from "@/api/queries";

interface Props {
  entry: Entry;
  icon?: ReactNode;
}

export function EntryVotes({ entry, icon }: Props) {
  const previousEntry = usePrevious(entry);
  const activeUser = useClientActiveUser();
  const [visible, setVisible] = useState(false);

  const isVoted = !!entry?.active_votes?.some(
      (v) => v.voter === activeUser?.username
  );

  const totalVotes =
      entry?.stats?.total_votes ||
      entry?.active_votes?.length ||
      entry?.total_votes ||
      0;

  const title = useMemo(() => {
    if (totalVotes === 0) return i18next.t("entry-votes.title-empty");
    if (totalVotes === 1) return i18next.t("entry-votes.title");
    return i18next.t("entry-votes.title-n", { n: totalVotes });
  }, [totalVotes]);

  const hasDifferentVotes =
      previousEntry?.active_votes?.length !== entry?.active_votes?.length;

  const hasCurrentUserVote = entry?.active_votes?.some(
      (v) => v.voter === activeUser?.username
  );

  const child = (
      <>
        <div
            className={`heart-icon ${isVoted ? "voted" : ""} ${
                hasDifferentVotes && hasCurrentUserVote ? "vote-done" : ""
            }`}
        >
          {icon ?? heartSvg}
        </div>
        {totalVotes}
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
          <span className="inner-btn" onClick={() => setVisible(true)}>
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
