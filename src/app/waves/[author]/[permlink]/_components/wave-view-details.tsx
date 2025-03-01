"use client";

import { WavesListItemHeader } from "@/app/waves/_components/waves-list-item-header";
import { WaveActions, WaveForm } from "@/features/waves";
import { WaveEntry } from "@/entities";
import React, { memo, useState } from "react";
import { Modal, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { EcencyRenderer } from "@ecency/renderer";
import useMount from "react-use/lib/useMount";

const EcencyRendererMemo = memo(EcencyRenderer);

interface Props {
  entry: WaveEntry;
}

export function WaveViewDetails({ entry: initialEntry }: Props) {
  const { data: entry } = EcencyEntriesCacheManagement.getEntryQuery(initialEntry).useClientQuery();

  const [showEditModal, setShowEditModal] = useState(false);

  const status = "default";

  useMount(() => window.scrollTo(0, 0));

  return (
    <div className="relative z-10 rounded-2xl bg-white dark:bg-dark-200 cursor-pointer">
      <WavesListItemHeader
        interactable={false}
        entry={entry!}
        hasParent={false}
        pure={false}
        status={status}
      />
      <div className="p-4">
        <EcencyRendererMemo value={entry?.body ?? ""} />
      </div>
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
