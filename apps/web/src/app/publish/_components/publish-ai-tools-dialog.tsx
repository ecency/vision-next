import { Modal, ModalBody, ModalFooter, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import React from "react";
import { usePublishState } from "@/app/publish/_hooks";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
import { Alert } from "@ui/alert";
import { AiToolsMeta } from "@/entities";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
}

// Optional, author-controlled AI-usage disclosure. Writes the `ai_tools` json_metadata used
// by other Hive frontends so the disclosure shows consistently across them. Ecency pre-checks
// these when its own AI tools are used, but the author can toggle them freely before publishing.
export function PublishAiToolsDialog({ show, setShow }: Props) {
  const { aiTools, setAiTools } = usePublishState();

  const toggle = (key: keyof AiToolsMeta) => (value: boolean) =>
    setAiTools((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal show={show} onHide={() => setShow(false)} centered={true}>
      <ModalHeader closeButton={true}>{i18next.t("ai-usage.dialog-title")}</ModalHeader>
      <ModalBody>
        <Alert className="mb-4">{i18next.t("ai-usage.dialog-hint")}</Alert>
        <div className="flex flex-col gap-3">
          <FormControl
            type="checkbox"
            label={i18next.t("ai-usage.media-generation")}
            checked={!!aiTools.media_generation}
            onChange={toggle("media_generation")}
          />
          <FormControl
            type="checkbox"
            label={i18next.t("ai-usage.writing-edit")}
            checked={!!aiTools.writing_edit}
            onChange={toggle("writing_edit")}
          />
        </div>
      </ModalBody>
      <ModalFooter className="justify-end flex">
        <Button appearance="gray" onClick={() => setShow(false)} size="sm">
          {i18next.t("g.close")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
