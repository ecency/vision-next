import React from "react";
import defaults from "@/defaults.json";
import { setProxyBase } from "@ecency/render-helper";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import i18next from "i18next";
import { DraftsList } from "@/features/shared/drafts/drafts-list";

setProxyBase(defaults.imageServer);

interface Props {
  show: boolean;
  setShow: (v: boolean) => void;
  onPick?: (url: string) => void;
}

export function DraftsDialog({ show, setShow, onPick }: Props) {
  return (
    <Modal show={show} centered={true} onHide={() => setShow(false)} size="lg">
      <ModalHeader closeButton={true}>{i18next.t("drafts.title")}</ModalHeader>
      <ModalBody>
        <DraftsList onHide={() => setShow(false)} onPick={onPick} />
      </ModalBody>
    </Modal>
  );
}
