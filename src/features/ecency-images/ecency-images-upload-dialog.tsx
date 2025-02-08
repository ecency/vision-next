import i18next from "i18next";
import { Modal, ModalBody, ModalHeader } from "../ui";
import { EcencyImagesUploadForm } from "./ecency-images-upload-form";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";

interface Props {
    show: boolean;
    setShow: (show: boolean) => void;
}

export function EcencyImagesUploadDialog({ show, setShow }: Props) {
    const [processingFile, setProcessingFile] = useState<File>();

    return <Modal show={show} onHide={() => setShow(false)} centered={true}>
        <ModalHeader closeButton={true}>
            {i18next.t("ecency-images.upload-image")}
        </ModalHeader>
        <ModalBody>
            <AnimatePresence>
                {!processingFile && <EcencyImagesUploadForm onFilePick={f => setProcessingFile(f)} />}
            </AnimatePresence>
        </ModalBody>
    </Modal>
}