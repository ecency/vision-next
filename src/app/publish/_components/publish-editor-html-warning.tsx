import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@/features/ui";
import { UilArrow } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Link from "next/link";

interface Props {
  show: boolean;
  setShow: (v: boolean) => void;
}

export function PublishEditorHtmlWarning({ show, setShow }: Props) {
  return (
    <Modal centered={true} show={show} onHide={() => setShow(false)}>
      <ModalHeader closeButton={true} />
      <ModalBody className="flex flex-col items-center gap-4">
        <UilArrow className="w-12 h-12 text-blue-dark-sky" />
        <div className="font-bold">{i18next.t("publish.html-warning.title")}</div>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {i18next.t("publish.html-warning.content")}
        </div>
      </ModalBody>
      <ModalFooter className="flex justify-end gap-2">
        <Link href="/submit" target="_blank" rel="noreferrer">
          <Button size="sm">{i18next.t("publish.back-to-old")}</Button>
        </Link>
        <Button size="sm" appearance="gray" onClick={() => setShow(false)}>
          {i18next.t("g.close")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
