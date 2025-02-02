import React, { useRef, useState } from "react";
import { readClipboard } from "@/utils/clipboard";
import { useMount } from "react-use";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import i18next from "i18next";
import { Form } from "@ui/form";
import { FormControl } from "@ui/input";
import { handleInvalid, handleOnInput } from "@/utils";
import { Button } from "@ui/button";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
  onSubmit: (text: string, link: string) => void;
}

export function PublishEditorToolbarAddLinkDialog({ onSubmit, setShow, show }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const [text, setText] = useState("");
  const [link, setLink] = useState("https://");

  const textChanged = (e: React.ChangeEvent<HTMLInputElement>): void => setText(e.target.value);
  const linkChanged = (e: React.ChangeEvent<HTMLInputElement>): void => setLink(e.target.value);
  const handleClipboard = async () => {
    const clipboard = await readClipboard();

    if (clipboard && (clipboard.startsWith("https://") || clipboard.startsWith("http://"))) {
      setLink(clipboard);
    }
  };

  useMount(() => {
    handleClipboard();
  });

  return (
    <Modal show={show} centered={true} onHide={() => setShow(false)} className="add-link-modal">
      <ModalHeader closeButton={true}>
        <ModalTitle>{i18next.t("add-link.title")}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <div className="dialog-content">
          <Form
            ref={formRef}
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              e.stopPropagation();

              if (!formRef.current?.checkValidity()) {
                return;
              }

              onSubmit(text, link);
            }}
          >
            <div className="mb-4">
              <FormControl
                type="text"
                autoComplete="off"
                value={text}
                placeholder={i18next.t("add-link.text-label")}
                onChange={textChanged}
                autoFocus={true}
                required={true}
                onInvalid={(e: any) => handleInvalid(e, "add-link.", "validation-text")}
                onInput={handleOnInput}
              />
            </div>
            <div className="mb-4">
              <FormControl
                type="text"
                autoComplete="off"
                value={link}
                placeholder={i18next.t("add-link.link-label")}
                onChange={linkChanged}
                required={true}
                onInvalid={(e: any) => handleInvalid(e, "add-link.", "validation-link")}
                onInput={handleOnInput}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">{i18next.t("g.add")}</Button>
            </div>
          </Form>
        </div>
      </ModalBody>
    </Modal>
  );
}
