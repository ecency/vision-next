import i18next from "i18next";
import { Modal, ModalBody, ModalHeader } from "../ui";
import { EcencyImagesUploadForm } from "./ecency-images-upload-form";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { EcencyImagesUploadConfirmation } from "./ecency-images-upload-confirmation";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
  onPick: (link: string) => void;
}

export function EcencyImagesUploadDialog({ show, setShow, onPick }: Props) {
  const [processingFile, setProcessingFile] = useState<File>();

  return (
    <Modal
      show={show}
      onHide={() => setShow(false)}
      centered={true}
      size={processingFile ? "lg" : "md"}
    >
      <ModalHeader closeButton={true}>{i18next.t("ecency-images.upload-image")}</ModalHeader>
      <ModalBody>
        <AnimatePresence>
          {!processingFile && <EcencyImagesUploadForm onFilePick={(f) => setProcessingFile(f)} />}
          {processingFile && (
            <EcencyImagesUploadConfirmation
              file={processingFile}
              onCancel={() => setProcessingFile(undefined)}
              onUpload={(link) => {
                onPick(link);
                setProcessingFile(undefined);
              }}
            />
          )}
        </AnimatePresence>
      </ModalBody>
    </Modal>
  );
}
