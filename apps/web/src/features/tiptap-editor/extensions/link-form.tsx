import { Button, FormControl } from "@/features/ui";
import { Form } from "@/features/ui/form";
import { UilEnter, UilLinkBroken } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useRef, useState } from "react";
import { object, string } from "yup";
import { normalizeLinkHref } from "../functions/normalize-link-href";

const linkSchema = object({
  link: string().url().required()
});

interface Props {
  onSubmit: (link: string) => void;
  onDelete: () => void;
  onCancel?: () => void;
  deletable: boolean;
  initialValue?: string;
}

export function PublishEditorToolbarLinkForm({
  onSubmit,
  deletable,
  initialValue,
  onDelete,
  onCancel
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

        const normalized = normalizeLinkHref(link);

        try {
          if (await linkSchema.validate({ link: normalized })) {
            onSubmit(normalized);
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
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel?.();
          }
        }}
        autoFocus={true}
        required={true}
        aria-invalid={isLinkInvalid}
        size="sm"
        className="font-normal"
      />
      <Button
        type="submit"
        icon={<UilEnter />}
        disabled={!link.trim()}
        appearance="gray"
        size="xs"
        aria-label={i18next.t("g.confirm", { defaultValue: "Confirm" })}
      />
      {deletable && (
        <Button
          icon={<UilLinkBroken />}
          appearance="gray-link"
          size="xs"
          onClick={onDelete}
          aria-label={i18next.t("publish.action-bar.remove-link")}
        />
      )}
    </Form>
  );
}
