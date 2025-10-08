import { Button, FormControl, Modal, ModalBody, ModalFooter, ModalHeader } from "@/features/ui";
import { UilPlus } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useState } from "react";

interface Props {
  show: boolean;
  setShow: (v: boolean) => void;
  onAdd: (link: string) => void;
}

export function PublishEditorVideoByLinkDialog({ show, setShow, onAdd }: Props) {
  const [link, setLink] = useState("");

  return (
    <Modal show={show} onHide={() => setShow(false)} centered={true}>
      <ModalHeader closeButton={true}>{i18next.t("publish.video-by-link")}</ModalHeader>
      <ModalBody>
        <div className="text-sm opacity-50 mb-4">{i18next.t("publish.video-link-hint")}</div>
        <FormControl
          type="text"
          value={link}
          placeholder={i18next.t("publish.video-link-label")}
          onChange={(e) => setLink(e.target.value)}
        />
      </ModalBody>
      <ModalFooter className="flex justify-end">
        <Button
          icon={<UilPlus />}
          size="sm"
          disabled={!link}
          onClick={() => {
            onAdd(link);
            setLink("");
          }}
        >
          {i18next.t("g.add")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
