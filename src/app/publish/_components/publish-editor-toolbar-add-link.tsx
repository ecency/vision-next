import { Button, FormControl, Popover, PopoverContent, StyledTooltip } from "@/features/ui";
import { Form } from "@/features/ui/form";
import { handleInvalid, handleOnInput } from "@/utils";
import { Editor } from "@tiptap/core";
import { UilEnter, UilExternalLinkAlt, UilLink } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Link from "next/link";
import { useRef, useState } from "react";

interface Props {
  editor: Editor;
}

export function PublishEditorToolbarLinkForm({ onSubmit }: { onSubmit: (link: string) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [link, setLink] = useState("https://");

  return (
    <Form
      ref={formRef}
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!formRef.current?.checkValidity()) {
          return;
        }

        onSubmit(link);
      }}
      className="flex items-center gap-2"
    >
      <FormControl
        type="text"
        autoComplete="off"
        value={link}
        placeholder={i18next.t("add-link.text-label")}
        onChange={(e) => setLink(e.target.value)}
        autoFocus={true}
        required={true}
        onInvalid={(e: any) => handleInvalid(e, "add-link.", "validation-text")}
        onInput={handleOnInput}
        size="sm"
      />
      <Button type="submit" icon={<UilEnter />} disabled={!link} appearance="gray" size="xs" />
      <Link href={link} target="external">
        <Button icon={<UilExternalLinkAlt />} disabled={!link} appearance="gray-link" size="xs" />
      </Link>
    </Form>
  );
}

export function PublishEditorToolbarAddLink({ editor }: Props) {
  const [show, setShow] = useState(false);

  return (
    <StyledTooltip content={show ? "" : i18next.t("publish.action-bar.link")}>
      <Button
        appearance={editor?.isActive("link") ? "link" : "gray-link"}
        size="sm"
        onClick={() => setShow(true)}
        icon={<UilLink />}
      />
      <Popover show={show} setShow={setShow} anchorParent={true}>
        <PopoverContent>
          <PublishEditorToolbarLinkForm
            onSubmit={(href) => {
              editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
              setShow(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </StyledTooltip>
  );
}
