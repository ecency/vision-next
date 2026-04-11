"use client";

import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import i18next from "i18next";
import { AiImageGenerator } from "./ai-image-generator";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
  onInsert: (url: string) => void;
  suggestedPrompt?: string;
}

export function AiImageGeneratorDialog({ show, setShow, onInsert, suggestedPrompt }: Props) {
  return (
    <Modal show={show} centered={true} onHide={() => setShow(false)} size="lg">
      <ModalHeader closeButton={true}>
        <ModalTitle>{i18next.t("ai-image-generator.title")}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <AiImageGenerator
          showInsertAction={true}
          suggestedPrompt={suggestedPrompt}
          onInsert={(url) => {
            onInsert(url);
            setShow(false);
          }}
        />
      </ModalBody>
    </Modal>
  );
}
