import React, { useEffect, useRef, useState } from "react";
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
  initialMode?: "list" | "save";
  canSaveCurrent?: boolean;
}

export function PostTemplatesDialog({
  show,
  setShow,
  onApply,
  onSaveCurrent,
  isSaving,
  confirmApply,
  initialMode = "list",
  canSaveCurrent = true
}: Props) {
  const [mode, setMode] = useState<"list" | "save">(initialMode);
  const [name, setName] = useState("");

  const form = useRef<HTMLFormElement>(null);

  // The dialog stays mounted between opens; each open starts at the caller's
  // requested mode and a dismissed save form must not reappear.
  useEffect(() => {
    if (show) {
      setMode(initialMode);
    } else {
      setName("");
    }
  }, [show, initialMode]);

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
            canSave={canSaveCurrent}
          />
        )}
        {mode === "save" && !canSaveCurrent && (
          <div className="flex flex-col items-start gap-4">
            <div className="text-sm opacity-75">
              {i18next.t("post-templates.empty-editor-hint")}
            </div>
            <Button appearance="gray" size="sm" onClick={() => setMode("list")}>
              {i18next.t("post-templates.cancel")}
            </Button>
          </div>
        )}
        {mode === "save" && canSaveCurrent && (
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
