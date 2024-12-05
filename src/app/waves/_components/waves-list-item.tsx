"use client";

import { WaveEntry } from "@/entities";
import { WavesListItemHeader } from "@/app/waves/_components/waves-list-item-header";
import React, { ReactNode, useCallback, useRef } from "react";
import { useRenderWaveBody, WaveActions } from "@/features/waves";
import useMount from "react-use/lib/useMount";
import { renderPostBody } from "@ecency/render-helper";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { motion } from "framer-motion";
import "./waves-list-item.scss";
import { useRouter } from "next/navigation";
import { classNameObject } from "@ui/util";
import { PollWidget, useEntryPollExtractor } from "@/features/polls";

interface Props {
  item: WaveEntry;
  i: number;
  commentSlot?: ReactNode;
  onExpandReplies?: () => void;
  interactable?: boolean;
}

export function WavesListItem({
  item,
  i,
  commentSlot,
  onExpandReplies,
  interactable = true
}: Props) {
  const renderAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: entry } =
    EcencyEntriesCacheManagement.getEntryQuery<WaveEntry>(item).useClientQuery();

  const poll = useEntryPollExtractor(entry);
  const renderBody = useRenderWaveBody(renderAreaRef, item, {});

  useMount(() => renderBody());
  const status = "default";

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (!interactable) {
        return;
      }

      const path = `/waves/${item.author}/${item.permlink}`;

      switch (e.button) {
        case 0:
          router.push(path);
          break;
        case 1:
          window.open(path, "_blank");
          break;
        default:
          null;
      }
    },
    [item.author, item.permlink, router]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: i * 0.2 }}
      className={classNameObject({
        "waves-list-item first:rounded-t-2xl last:rounded-b-2xl bg-white dark:bg-dark-200 border-b border-[--border-color] last:border-b-0":
          true,
        "hover:bg-gray-100 dark:hover:bg-dark-600-010 cursor-pointer": interactable
      })}
      onClick={onClick}
    >
      <WavesListItemHeader entry={entry!} hasParent={false} pure={false} status={status} />
      <div
        className="p-4 thread-render"
        ref={renderAreaRef}
        dangerouslySetInnerHTML={{ __html: renderPostBody(entry!) }}
        onClick={(e) => e.stopPropagation()}
      />
      {poll && (
        <div onClick={(e) => e.stopPropagation()} className="p-4">
          <PollWidget entry={entry} compact={true} poll={poll} isReadOnly={false} />
        </div>
      )}
      <WaveActions
        status={status}
        entry={item}
        onEntryView={() => onExpandReplies?.()}
        hasParent={false}
        pure={false}
        onEdit={() => {}}
        commentsSlot={commentSlot}
      />
    </motion.div>
  );
}
