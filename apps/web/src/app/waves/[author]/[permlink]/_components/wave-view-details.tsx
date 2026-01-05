"use client";

import { WavesListItemHeader } from "@/app/waves/_components/waves-list-item-header";
import { WaveActions, WaveForm } from "@/features/waves";
import { WaveEntry } from "@/entities";
import React, { useCallback, useState } from "react";
import { Modal, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import useMount from "react-use/lib/useMount";
import { PostContentRenderer } from "@/features/shared";
import { PollWidget, useEntryPollExtractor } from "@/features/polls";
import { usePathname, useRouter } from "next/navigation";
import { useOptionalWavesTagFilter } from "@/app/waves/_context";
import { getPostTipsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

interface Props {
  entry: WaveEntry;
}

export function WaveViewDetails({ entry: initialEntry }: Props) {
  const { data: entry } = EcencyEntriesCacheManagement.getEntryQuery(initialEntry).useClientQuery();

  const [showEditModal, setShowEditModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const tagFilter = useOptionalWavesTagFilter();

  const poll = useEntryPollExtractor(entry);
  const { data: postTips } = useQuery(getPostTipsQueryOptions(entry?.author ?? "", entry?.permlink ?? ""));

  const status = "default";

  useMount(() => window.scrollTo(0, 0));

  const handleTagClick = useCallback(
    (tag: string) => {
      if (!tagFilter) {
        return;
      }

      tagFilter.setSelectedTag(tag);

      if (pathname !== "/waves") {
        router.push("/waves");
      }
    },
    [pathname, router, tagFilter]
  );

  return (
    <div className="relative z-10 rounded-2xl bg-white dark:bg-dark-200 cursor-pointer">
      <div className="sticky top-0 z-20 rounded-t-2xl bg-white dark:bg-dark-200 border-b border-[--border-color]">
        <WavesListItemHeader
          interactable={false}
          entry={entry!}
          hasParent={false}
          pure={false}
          status={status}
          className="py-4"
          onClose={() => router.back()}
        />
      </div>
      <div className="p-4">
        <PostContentRenderer
          value={entry?.body ?? ""}
          onTagClick={tagFilter ? handleTagClick : undefined}
        />
        {poll && <PollWidget entry={entry} poll={poll} isReadOnly={false} />}
      </div>
      <WaveActions
        showStats={true}
        status={status}
        entry={entry!}
        onEntryView={() => {}}
        hasParent={false}
        pure={false}
        onEdit={() => setShowEditModal(true)}
        postTips={postTips}
      />
      <div className="border-t border-[--border-color]"></div>
      <WaveForm entry={undefined} replySource={entry} />

      <Modal centered={true} show={showEditModal} onHide={() => setShowEditModal(false)}>
        <ModalHeader closeButton={true}>{i18next.t("waves.edit-wave")}</ModalHeader>
        <WaveForm entry={entry} onSuccess={() => setShowEditModal(false)} />
      </Modal>
    </div>
  );
}
