import { EntryMenu, EntryVoteBtn, EntryVotes, UserAvatar } from "@/features/shared";
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
  commentsSlot: ReactNode;
  hasParent: boolean;
  pure: boolean;
  onEdit: (entry: WaveEntry) => void;
  onSeeFullThread?: () => void;
}

export function WaveActions({
  status,
  entry,
  onEntryView,
  commentsSlot,
  onSeeFullThread,
  pure,
  hasParent,
  onEdit
}: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  return (
    <>
      {status === "default" && (
        <div className="thread-item-actions">
          <div>
            <EntryVoteBtn entry={entry!} isPostSlider={false} />
            <EntryVotes entry={entry!} icon={voteSvg} />
            <Button appearance="link" onClick={() => onEntryView()}>
              <div className="flex items-center comments">
                <div style={{ paddingRight: 4 }}>{commentSvg}</div>
                <div>{commentsSlot ?? entry?.children}</div>
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
