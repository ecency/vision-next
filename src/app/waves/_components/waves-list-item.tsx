"use client";

import { Entry, WaveEntry } from "@/entities";
import { WavesListItemHeader } from "@/app/waves/_components/waves-list-item-header";
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getPromotedPostsQuery, getRelationshipBetweenAccountsQueryOptions } from "@ecency/sdk";
import { useGlobalStore } from "@/core/global-store";
import clsx from "clsx";

const INTERACTIVE_SELECTOR =
  "a,button,input,textarea,select,[role='button'],[role='link'],[role='menuitem'],[contenteditable='true']";

interface Props {
  item: WaveEntry;
  i: number;
  commentSlot?: ReactNode;
  onExpandReplies?: () => void;
  interactable?: boolean;
  now?: number;
}

export function WavesListItem({
  item,
  i,
  commentSlot,
  onExpandReplies,
  interactable = true,
  now
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
  const { data: promoted } = useQuery(getPromotedPostsQuery<Entry>("waves"));
  const hasPromoted = useMemo(
    () =>
      promoted?.some(
        ({ author, permlink }) => author === entry?.author && permlink === entry.permlink
      ),
    [promoted, entry]
  );

  const poll = useEntryPollExtractor(entry);
  const { mutateAsync: collectPageView } = useCollectPageViewEvent(
    `@${item.author}/${item.permlink}`
  );

  const isHidden = useMemo(
    () =>
      (entry?.net_rshares ?? 0) < -7000000000 &&
      (entry?.active_votes?.length ?? 0) > 3,
    [entry?.net_rshares, entry?.active_votes?.length]
  );

  const isCommunityMuted = entry?.stats?.gray;
  const isMuted = relations?.ignores || isHidden || isCommunityMuted;

  useEffect(() => {
    if (inViewport) {
      collectPageView();
    }
  }, [collectPageView, inViewport]);

  const status = "default";

  const isFromInteractiveElement = useCallback(
    (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const closestInteractive = target.closest(INTERACTIVE_SELECTOR);

      return closestInteractive !== null && closestInteractive !== rootRef.current;
    },
    []
  );

  const wavePath = useMemo(
    () => `/waves/${item.author}/${item.permlink}`,
    [item.author, item.permlink]
  );

  const openWave = useCallback(
    (openInNewTab: boolean) => {
      if (!interactable) {
        return;
      }

      if (openInNewTab) {
        window.open(wavePath, "_blank", "noopener,noreferrer");
      } else {
        router.push(wavePath);
      }
    },
    [interactable, router, wavePath]
  );

  const hasTextSelection = useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const selection = window.getSelection();

    if (!selection || selection.type !== "Range" || selection.toString().trim().length === 0) {
      return false;
    }

    const rootEl = rootRef.current;

    if (!rootEl) {
      return false;
    }

    const containsNode = (node: Node | null) => {
      if (!node) {
        return false;
      }

      const target = node.nodeType === Node.TEXT_NODE ? node.parentElement ?? node : node;

      return target ? rootEl.contains(target) : false;
    };

    return containsNode(selection.anchorNode) || containsNode(selection.focusNode);
  }, [rootRef]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (!interactable || e.defaultPrevented) {
        return;
      }

      if (isFromInteractiveElement(e.target) || hasTextSelection()) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.shiftKey) {
        openWave(true);
        return;
      }

      openWave(false);
    },
    [hasTextSelection, interactable, isFromInteractiveElement, openWave]
  );

  const onAuxClick = useCallback(
    (e: React.MouseEvent) => {
      if (!interactable || e.defaultPrevented) {
        return;
      }

      if (e.button === 1 && !isFromInteractiveElement(e.target) && !hasTextSelection()) {
        e.preventDefault();
        openWave(true);
      }
    },
    [hasTextSelection, interactable, isFromInteractiveElement, openWave]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!interactable) {
        return;
      }

      if (isFromInteractiveElement(e.target)) {
        return;
      }

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openWave(false);
      }
    },
    [interactable, isFromInteractiveElement, openWave]
  );

  const onHeaderClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick(e);
    },
    [onClick]
  );

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isMuted ? 0.5 : 1, scale: 1 }}
      transition={{ delay: Math.min(i, 5) * 0.05 }}
      className={clsx(
        "waves-list-item bg-white dark:bg-dark-200 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-dark-sky",
        grid === "feed" &&
          "first:rounded-t-2xl last:rounded-b-2xl border-b border-[--border-color] last:border-b-0",
        grid === "masonry" && "rounded-2xl",
        isMuted && "grayscale",
        hasPromoted && grid === "masonry" && "border border-blue-dark-sky",
        interactable && "cursor-pointer"
      )}
      role={interactable ? "link" : undefined}
      tabIndex={interactable ? 0 : -1}
      onClick={onClick}
      onAuxClick={onAuxClick}
      onKeyDown={onKeyDown}
    >
      {hasPromoted && (
        <div className="text-xs font-semibold uppercase rounded-br-lg px-1 rounded-tl-lg bg-blue-dark-sky text-white absolute top-[-1px] left-[-1px]">
          Promoted
        </div>
      )}
      <WavesListItemHeader
        entry={entry!}
        hasParent={false}
        pure={false}
        status={status}
        interactable={interactable}
        onViewFullThread={onHeaderClick}
        now={now}
      />
      <div className="p-4">
        {isMuted ? (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {i18next.t("waves.muted-post")}
          </div>
        ) : (
          <PostContentRenderer value={entry?.body ?? ""} />
        )}
      </div>
      {!isMuted && (
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
