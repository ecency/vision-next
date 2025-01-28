import React, { useState } from "react";
import "./_deck-post-viewer.scss";
import useMount from "react-use/lib/useMount";
import { DeckPostViewerCommentBox } from "./deck-post-viewer-comment-box";
import { commentSvg, voteSvg } from "../../icons";
import { Button } from "@ui/button";
import { Entry } from "@/entities";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { arrowLeftSvg } from "@ui/svg";
import i18next from "i18next";
import { Discussion, EntryInfo, EntryVoteBtn, EntryVotes } from "@/features/shared";
import { EcencyRenderer } from "@ecency/renderer";

interface Props {
  entry: Entry;
  backTitle?: string;
  onClose: () => void;
}

export const DeckPostViewer = ({ entry: initialEntry, onClose, backTitle }: Props) => {
  const [isMounted, setIsMounted] = useState(false);

  const { data: entry } = EcencyEntriesCacheManagement.getEntryQuery(initialEntry).useClientQuery();

  useMount(() => setIsMounted(true));

  return entry ? (
    <div className={"deck-post-viewer " + (isMounted ? "visible" : "")}>
      <div className="deck-post-viewer-header">
        <div className="actions flex pt-3 mr-3">
          <Button
            appearance="link"
            onClick={() => {
              setIsMounted(false);
              onClose();
            }}
            icon={arrowLeftSvg}
            iconPlacement="left"
          >
            {backTitle}
          </Button>
          <Button
            className="flex pt-[0.35rem]"
            outline={true}
            href={entry.url}
            target="_blank"
            size="sm"
          >
            {i18next.t("decks.columns.view-full-post")}
          </Button>
        </div>
        <div className="title p-3 pb-4 flex">
          <span>{entry.title}</span>
        </div>
      </div>
      <div className="px-3">
        <EntryInfo entry={entry} />
      </div>
      <div className="px-3 pb-4">
        <EcencyRenderer value={entry.body} />
      </div>
      <div className="bottom-actions p-3">
        <EntryVoteBtn entry={entry} isPostSlider={false} />
        <EntryVotes entry={entry} icon={voteSvg} />
        <div className="flex items-center comments">
          <div style={{ paddingRight: 4 }}>{commentSvg}</div>
          {entry.children}
        </div>
      </div>
      <div className="px-3 dark:[&>*>.comment-preview]:bg-dark-default">
        <DeckPostViewerCommentBox entry={entry} onReplied={() => {}} />
      </div>
      <div className="px-3">
        <Discussion parent={entry} community={null} hideControls={false} isRawContent={false} />
      </div>
    </div>
  ) : (
    <></>
  );
};
