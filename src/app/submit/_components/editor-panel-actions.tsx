import { Button } from "@ui/button";
import i18next from "i18next";
import { dotsMenuIconSvg } from "@ui/icons";
import React, { useState } from "react";
import { Draft, Entry } from "@/entities";
import { ModalConfirm } from "@/features/ui";

interface Props {
  editingEntry: Entry | null;
  editingDraft: Draft | null;
  setAdvanced: (v: boolean) => void;
  getHasAdvanced: boolean;
  advanced: boolean;
  onClear: () => void;
}

export function EditorPanelActions({
  editingEntry,
  editingDraft,
  onClear,
  advanced,
  setAdvanced,
  getHasAdvanced
}: Props) {
  const [clearModal, setClearModal] = useState(false);

  return (
    <div className="flex p-2 border-b border-[--border-color] items-center justify-between">
      {editingEntry === null && editingDraft === null && (
        <Button appearance="info" outline={true} size="sm" onClick={() => setClearModal(true)}>
          {i18next.t("submit.clear")}
        </Button>
      )}
      <Button
        size="sm"
        id="editor-advanced"
        outline={true}
        onClick={() => setAdvanced(!advanced)}
        icon={getHasAdvanced && dotsMenuIconSvg}
      >
        {advanced ? i18next.t("submit.preview") : i18next.t("submit.advanced")}
      </Button>
      {clearModal && (
        <ModalConfirm
          onConfirm={() => {
            onClear();
            setClearModal(false);
          }}
          onCancel={() => setClearModal(false)}
        />
      )}
    </div>
  );
}
