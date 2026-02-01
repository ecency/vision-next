"use client";

import { Button, FormControl, Modal, ModalBody, ModalFooter, ModalHeader } from "@/features/ui";
import i18next from "i18next";
import { useState } from "react";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
  onPick: (link: string, alt: string) => void;
}

export function PublishImageByLinkDialog({ show, setShow, onPick }: Props) {
  const [link, setLink] = useState("");
  const [alt, setAlt] = useState("");

  return (
    <Modal show={show} onHide={() => setShow(false)} centered={true}>
      <ModalHeader closeButton={true}>{i18next.t("publish.add-image-by-link")}</ModalHeader>
      <ModalBody>
        <FormControl
          type="text"
          value={link}
          placeholder={i18next.t("add-image.link-label")}
          onChange={(e) => setLink(e.target.value)}
        />
        <div className="mt-4 mb-1 text-sm text-gray-600 dark:text-gray-400">
          {i18next.t("publish.add-image-by-link-title-hint")}
        </div>
        <FormControl
          type="text"
          value={alt}
          placeholder={i18next.t("add-image.text-label")}
          onChange={(e) => setAlt(e.target.value)}
        />
      </ModalBody>
      <ModalFooter className="flex justify-end gap-2">
        <Button size="sm" appearance="gray" onClick={() => setShow(false)}>
          {i18next.t("g.cancel")}
        </Button>
        <Button
          size="sm"
          disabled={!link}
          onClick={() => {
            onPick(link, alt);
            setShow(false);
            setLink("");
            setAlt("");
          }}
        >
          {i18next.t("g.add")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
