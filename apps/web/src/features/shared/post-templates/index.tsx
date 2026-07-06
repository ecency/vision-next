import React, { useRef, useState } from "react";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import { Button, FormControl } from "@/features/ui";
import { Form } from "@/features/ui/form";
import { handleInvalid, handleOnInput } from "@/utils";
import i18next from "i18next";
import { Draft } from "@ecency/sdk";
import { PostTemplatesList } from "./post-templates-list";

interface Props {
  show: boolean;
  setShow: (v: boolean) => void;
  onApply: (draft: Draft) => void;
  onSaveCurrent: (name: string) => Promise<unknown>;
  isSaving: boolean;
  confirmApply: boolean;
}

export function PostTemplatesDialog({
  show,
  setShow,
  onApply,
  onSaveCurrent,
  isSaving,
  confirmApply
}: Props) {
  const [mode, setMode] = useState<"list" | "save">("list");
  const [name, setName] = useState("");

  const form = useRef<HTMLFormElement>(null);

  return (
    <Modal show={show} centered={true} onHide={() => setShow(false)} size="lg">
      <ModalHeader closeButton={true}>{i18next.t("post-templates.title")}</ModalHeader>
      <ModalBody>
        {mode === "list" && (
          <PostTemplatesList
            confirmApply={confirmApply}
            onApply={(draft) => {
              onApply(draft);
              setShow(false);
            }}
            onSave={() => setMode("save")}
          />
        )}
        {mode === "save" && (
          <Form
            ref={form}
            onSubmit={async (e: React.FormEvent) => {
              e.preventDefault();
              e.stopPropagation();

              if (!form.current?.checkValidity() || !name.trim()) {
                return;
              }

              try {
                await onSaveCurrent(name.trim());
                setName("");
                setMode("list");
              } catch (e) {
                // error feedback comes from the save mutation
              }
            }}
          >
            <div className="mb-4">
              <label>{i18next.t("post-templates.name-label")}</label>
              <FormControl
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={true}
                type="text"
                maxLength={255}
                autoFocus={true}
                placeholder={i18next.t("post-templates.name-placeholder")}
                onInvalid={(e: any) => handleInvalid(e, "post-templates.", "validation-name")}
                onInput={handleOnInput}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button appearance="gray" disabled={isSaving} onClick={() => setMode("list")}>
                {i18next.t("post-templates.cancel")}
              </Button>
              <Button type="submit" disabled={isSaving} isLoading={isSaving}>
                {i18next.t("post-templates.save")}
              </Button>
            </div>
          </Form>
        )}
      </ModalBody>
    </Modal>
  );
}
