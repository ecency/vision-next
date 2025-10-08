import React, { useCallback, useState } from "react";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import { Fragments } from "@/features/shared/fragments/fragments-list";
import i18next from "i18next";
import { AddFragment } from "./add-fragment";
import { EditFragment } from "./edit-fragment";
import { Fragment } from "@/entities";

interface Props {
  show: boolean;
  setShow: (v: boolean) => void;
  onPick?: (v: string) => void;
}

export function FragmentsDialog({ show, setShow, onPick }: Props) {
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingFragment, setEditingFragment] = useState<Fragment>();

  const resetEditing = useCallback(() => {
    setEditingFragment(undefined);
    setMode("list");
  }, []);

  return (
    <Modal show={show} centered={true} onHide={() => setShow(false)} size="lg">
      <ModalHeader closeButton={true}>{i18next.t("fragments.title")}</ModalHeader>
      <ModalBody>
        {mode === "list" && (
          <Fragments
            onPick={onPick}
            onAdd={() => setMode("add")}
            onEdit={(item) => {
              setMode("edit");
              setEditingFragment(item);
            }}
          />
        )}
        {mode === "add" && (
          <AddFragment onAdd={() => setMode("list")} onCancel={() => setMode("list")} />
        )}
        {mode === "edit" && editingFragment && (
          <EditFragment item={editingFragment} onUpdate={resetEditing} onCancel={resetEditing} />
        )}
      </ModalBody>
    </Modal>
  );
}
