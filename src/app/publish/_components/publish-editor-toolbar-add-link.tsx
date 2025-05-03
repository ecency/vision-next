import { Button, FormControl, Popover, PopoverContent, StyledTooltip } from "@/features/ui";
import { Form } from "@/features/ui/form";
import { Editor } from "@tiptap/core";
import { UilEnter, UilExternalLinkAlt, UilLink } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Link from "next/link";
import { useRef, useState } from "react";
import { object, string } from "yup";

interface Props {
  editor: Editor;
}

const linkSchema = object({
  link: string().url().required()
});

export function PublishEditorToolbarLinkForm({ onSubmit }: { onSubmit: (link: string) => void }) {
  const formRef = useRef<HTMLFormElement>(null);

  const [link, setLink] = useState("https://");
  const [isLinkInvalid, setIsLinkInvalid] = useState(false);

  return (
    <Form
      ref={formRef}
      onSubmit={async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
          if (await linkSchema.validate({ link })) {
            onSubmit(link);
          }
        } catch (e) {
          setIsLinkInvalid(true);
        }
      }}
      className="flex items-center gap-2"
    >
      <FormControl
        type="text"
        autoComplete="off"
        value={link}
        placeholder={i18next.t("add-link.text-label")}
        onChange={(e) => {
          setLink(e.target.value);
          setIsLinkInvalid(false);
        }}
        autoFocus={true}
        required={true}
        aria-invalid={isLinkInvalid}
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
      <Popover show={show} setShow={setShow} behavior="click">
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
