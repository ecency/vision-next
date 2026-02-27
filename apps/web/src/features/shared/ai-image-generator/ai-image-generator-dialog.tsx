"use client";

import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import i18next from "i18next";
import { AiImageGenerator } from "./ai-image-generator";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
  onInsert: (url: string) => void;
}

export function AiImageGeneratorDialog({ show, setShow, onInsert }: Props) {
  return (
    <Modal show={show} centered={true} onHide={() => setShow(false)} size="lg">
      <ModalHeader closeButton={true}>
        <ModalTitle>{i18next.t("ai-image-generator.title")}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <AiImageGenerator
          showInsertAction={true}
          onInsert={(url) => {
            onInsert(url);
            setShow(false);
          }}
        />
      </ModalBody>
    </Modal>
  );
}
