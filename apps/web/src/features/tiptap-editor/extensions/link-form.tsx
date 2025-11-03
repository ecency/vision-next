import { Button, FormControl } from "@/features/ui";
import { Form } from "@/features/ui/form";
import { UilEnter, UilTrashAlt } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useRef, useState } from "react";
import { object, string } from "yup";

const linkSchema = object({
  link: string().url().required()
});

interface Props {
  onSubmit: (link: string) => void;
  onDelete: () => void;
  deletable: boolean;
  initialValue?: string;
}

export function PublishEditorToolbarLinkForm({
  onSubmit,
  deletable,
  initialValue,
  onDelete
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const [link, setLink] = useState(initialValue ?? "");
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
        placeholder={i18next.t("add-link.link-label")}
        onChange={(e) => {
          setLink(e.target.value);
          setIsLinkInvalid(false);
        }}
        autoFocus={true}
        required={true}
        aria-invalid={isLinkInvalid}
        size="sm"
        className="font-normal"
      />
      <Button type="submit" icon={<UilEnter />} disabled={!link} appearance="gray" size="xs" />
      {deletable && (
        <Button icon={<UilTrashAlt />} appearance="gray-link" size="xs" onClick={onDelete} />
      )}
    </Form>
  );
}
