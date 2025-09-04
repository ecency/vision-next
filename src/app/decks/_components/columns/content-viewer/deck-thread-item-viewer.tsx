import React, { useRef } from "react";
import { DeckThreadItemSkeleton, ThreadItem } from "../deck-items";
import { IdentifiableEntry } from "../deck-threads-manager";
import { DeckThreadsForm } from "../../deck-threads-form";
import { DeckThreadItemViewerReply } from "./deck-thread-item-viewer-reply";
import { repliesIconSvg } from "../../icons";
import { Button } from "@ui/button";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import i18next from "i18next";
import { arrowLeftSvg } from "@ui/svg";
import { addReplyToDiscussionsList } from "@/api/queries/get-discussions-query";
import { useMounted } from "@/utils/use-mounted";
import { useQueryClient } from "@tanstack/react-query";
import { WaveEntry } from "@/entities";
import { useWaveDiscussionsList } from "@/features/waves";
import { makeEntryPath } from "@/utils";

interface Props {
  entry: WaveEntry;
  backTitle?: string;
  onClose: () => void;
  highlightedEntry?: string;
}

export const DeckThreadItemViewer = ({
  entry: initialEntry,
  backTitle,
  onClose,
  highlightedEntry
}: Props) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const { data: entry } =
    EcencyEntriesCacheManagement.getEntryQuery<WaveEntry>(initialEntry).useClientQuery();
  const isMounted = useMounted();

  const { addReply } = EcencyEntriesCacheManagement.useAddReply(entry);
  const { updateRepliesCount } = EcencyEntriesCacheManagement.useUpdateRepliesCount(entry);

  const data = useWaveDiscussionsList(entry!);

  return (
    <div
      ref={rootRef}
      className={"deck-post-viewer deck-thread-item-viewer " + (isMounted ? "visible" : "")}
    >
      <div className="deck-post-viewer-header">
        <div className="actions flex pt-3 mr-3">
          <Button
            appearance="link"
            onClick={() => {
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
            href={entry ? makeEntryPath(entry.category, entry.author, entry.permlink) : "#"}
            target="_blank"
            size="sm"
          >
            {i18next.t("decks.columns.view-full-post")}
          </Button>
        </div>
      </div>
      <ThreadItem
        pure={true}
        initialEntry={entry!}
        onEntryView={() => {}}
        onMounted={() => {}}
        onResize={() => {}}
      />
      <DeckThreadsForm
        inline={true}
        placeholder={i18next.t("decks.threads-form.write-your-reply")}
        replySource={entry}
        onSuccess={(reply) => {
          reply.replies = [];
          if (data) {
            addReplyToDiscussionsList(entry!, reply, queryClient);
            // Update entry in global cache
            addReply(reply);
          }
        }}
      />
      <div className="deck-thread-item-viewer-replies">
        {data.length > 0 && (
          <>
            {data.map((reply) => (
              <DeckThreadItemViewerReply
                isHighlighted={highlightedEntry === `${reply.author}/${reply.permlink}`}
                key={reply.post_id}
                entry={reply as IdentifiableEntry}
                parentEntry={entry!}
                incrementParentEntryCount={() => updateRepliesCount(entry!.children + 1)}
              />
            ))}
            {data.length === 0 && (
              <div className="no-replies-placeholder">
                {repliesIconSvg}
                <p>{i18next.t("decks.columns.no-replies")}</p>
                <Button
                  outline={true}
                  size="sm"
                  onClick={() =>
                    (
                      rootRef.current?.querySelector(".editor-control") as HTMLElement | null
                    )?.focus()
                  }
                >
                  {i18next.t("decks.columns.add-new-reply")}
                </Button>
              </div>
            )}
          </>
        )}

        <div className="skeleton-list">
          {data.length === 0 &&
            Array.from(new Array(20)).map((_, i) => <DeckThreadItemSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
};
