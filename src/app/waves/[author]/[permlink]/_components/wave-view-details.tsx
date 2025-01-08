"use client";

import { WavesListItemHeader } from "@/app/waves/_components/waves-list-item-header";
import { renderPostBody } from "@ecency/render-helper";
import { useRenderWaveBody, WaveActions, WaveForm } from "@/features/waves";
import { WaveEntry } from "@/entities";
import React, { useEffect, useRef, useState } from "react";
import { Modal, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import uuid from "tus-js-client/lib.esm/uuid";

interface Props {
  entry: WaveEntry;
}

export function WaveViewDetails({ entry: initialEntry }: Props) {
  const renderAreaRef = useRef<HTMLDivElement>(null);

  const { data: entry } = EcencyEntriesCacheManagement.getEntryQuery(initialEntry).useClientQuery();
  const renderBody = useRenderWaveBody(renderAreaRef, entry!, {});

  const [showEditModal, setShowEditModal] = useState(false);

  const status = "default";

  useEffect(() => {
    if (renderAreaRef.current && entry) {
      renderAreaRef.current.innerHTML = renderPostBody({
        ...entry,
        permlink: entry.permlink + uuid() // Trigger cache resetting
      });
      renderBody();
    }
  }, [entry, renderBody]);

  return (
    <div className="relative z-10 rounded-2xl bg-white dark:bg-dark-200 cursor-pointer">
      <WavesListItemHeader entry={entry!} hasParent={false} pure={false} status={status} />
      <div className="p-4 thread-render" ref={renderAreaRef} />
      <WaveActions
        showStats={true}
        status={status}
        entry={entry!}
        onEntryView={() => {}}
        hasParent={false}
        pure={false}
        onEdit={() => setShowEditModal(true)}
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
