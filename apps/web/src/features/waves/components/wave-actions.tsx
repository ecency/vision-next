import { EntryMenu, EntryStats, EntryVoteBtn, EntryVotes, UserAvatar } from "@/features/shared";
import { commentSvg, voteSvg } from "@/app/decks/_components/icons";
import { Button } from "@ui/button";
import i18next from "i18next";
import React, { ReactNode } from "react";
import { WaveEntry } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import "./wave-actions.scss";

interface Props {
  status: string;
  entry: WaveEntry;
  onEntryView: () => void;
  commentsSlot?: ReactNode;
  hasParent: boolean;
  pure: boolean;
  onEdit: (entry: WaveEntry) => void;
  onSeeFullThread?: () => void;
  showStats?: boolean;
  showVoteSummary?: boolean;
  showCommentCount?: boolean;
}

export function WaveActions({
  status,
  entry,
  onEntryView,
  commentsSlot,
  onSeeFullThread,
  pure,
  hasParent,
  onEdit,
  showStats = false,
  showVoteSummary = true,
  showCommentCount = true
}: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  return (
    <>
      {status === "default" && (
        <div className="thread-item-actions" onClick={(e) => e.stopPropagation()}>
          <div>
            <EntryVoteBtn entry={entry!} isPostSlider={false} />
            {showStats && <EntryStats entry={entry!} />}
            <EntryVotes entry={entry!} icon={voteSvg} hideCount={!showVoteSummary} />
            <Button
              iconPlacement="left"
              size="sm"
              appearance="gray-link"
              icon={commentSvg}
              onClick={() => onEntryView()}
              aria-label={i18next.t("waves.reply")}
              title={i18next.t("waves.reply")}
            >
              <div
                className={`wave-actions__comment-count${showCommentCount ? "" : " wave-actions__comment-count--hidden"}`}
                aria-hidden={!showCommentCount}
              >
                {commentsSlot ?? entry?.children}
              </div>
            </Button>
          </div>
          <div>
            <EntryMenu entry={entry!} />
            {activeUser?.username === entry?.author && (
              <Button className="edit-btn" appearance="link" onClick={() => onEdit(entry!)}>
                {i18next.t("decks.columns.edit-wave")}
              </Button>
            )}
          </div>
        </div>
      )}
      {hasParent && !pure && (
        <div className="thread-item-parent">
          <UserAvatar size="small" username={entry?.parent_author!!} />
          <Button appearance="link" className="host" onClick={onSeeFullThread}>
            {i18next.t("decks.columns.see-full-thread")}
          </Button>
        </div>
      )}
    </>
  );
}
