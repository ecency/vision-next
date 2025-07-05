"use client";

import { WaveEntry } from "@/entities";
import { WavesListItemHeader } from "@/app/waves/_components/waves-list-item-header";
import React, { memo, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { WaveActions, WaveForm } from "@/features/waves";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { motion } from "framer-motion";
import "./waves-list-item.scss";
import { useRouter } from "next/navigation";
import { classNameObject } from "@ui/util";
import { PollWidget, useEntryPollExtractor } from "@/features/polls";
import { Modal, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { useInViewport } from "react-in-viewport";
import { useCollectPageViewEvent } from "@/api/mutations";
import { useWavesGrid } from "@/app/waves/_hooks";
import { PostContentRenderer } from "@/features/shared";
import { useQuery } from "@tanstack/react-query";
import { getRelationshipBetweenAccountsQueryOptions } from "@ecency/sdk";
import { useGlobalStore } from "@/core/global-store";

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
  const activeUser = useGlobalStore((s) => s.activeUser);

  const [grid] = useWavesGrid();

  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { inViewport } = useInViewport(rootRef);

  const [showEditModal, setShowEditModal] = useState(false);

  const { data: entry } =
    EcencyEntriesCacheManagement.getEntryQuery<WaveEntry>(item).useClientQuery();
  const { data: relations } = useQuery(
    getRelationshipBetweenAccountsQueryOptions(activeUser?.username, item.author)
  );

  const poll = useEntryPollExtractor(entry);
  const { mutateAsync: collectPageView } = useCollectPageViewEvent(
    `@${item.author}/${item.permlink}`
  );

  useEffect(() => {
    if (inViewport) {
      collectPageView();
    }
  }, [collectPageView, inViewport]);

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
    [interactable, item.author, item.permlink, router]
  );

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: relations?.ignores ? 0.5 : 1, scale: 1 }}
      transition={{ delay: i * 0.2 }}
      className={classNameObject({
        "waves-list-item bg-white dark:bg-dark-200": true,
        "first:rounded-t-2xl last:rounded-b-2xl border-b border-[--border-color] last:border-b-0":
          grid === "feed",
        "rounded-2xl": grid === "masonry",
        grayscale: relations?.ignores
        // "hover:bg-gray-100 dark:hover:bg-dark-600-010 cursor-pointer": interactable
      })}
    >
      <WavesListItemHeader
        entry={entry!}
        hasParent={false}
        pure={false}
        status={status}
        interactable={interactable}
        onViewFullThread={onClick}
      />
      <div className="p-4" onClick={(e) => e.stopPropagation()}>
        {relations?.ignores ? (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {i18next.t("waves.muted-post")}
          </div>
        ) : (
          <PostContentRenderer value={entry?.body ?? ""} />
        )}
      </div>
      {!relations?.ignores && (
        <>
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
            onEdit={() => setShowEditModal(true)}
            commentsSlot={commentSlot}
          />

          <Modal centered={true} show={showEditModal} onHide={() => setShowEditModal(false)}>
            <ModalHeader closeButton={true}>{i18next.t("waves.edit-wave")}</ModalHeader>
            <WaveForm entry={entry} onSuccess={() => setShowEditModal(false)} />
          </Modal>
        </>
      )}
    </motion.div>
  );
}
