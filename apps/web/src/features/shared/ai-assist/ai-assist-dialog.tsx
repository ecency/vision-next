"use client";

import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import i18next from "i18next";
import { AiAssist, type AiAssistAction } from "./ai-assist";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
  onApply?: (output: string, action: AiAssistAction) => void;
  initialText?: string;
}

export function AiAssistDialog({ show, setShow, onApply, initialText }: Props) {
  return (
    <Modal show={show} centered={true} onHide={() => setShow(false)} size="lg">
      <ModalHeader closeButton={true}>
        <ModalTitle>{i18next.t("ai-assist.title")}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {i18next.t("ai-assist.hint")}
        </p>
        <AiAssist
          initialText={initialText}
          onApply={onApply}
        />
      </ModalBody>
    </Modal>
  );
}
