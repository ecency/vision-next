import { Button, FormControl } from "@/features/ui";
import { Form } from "@/features/ui/form";
import { handleInvalid, handleOnInput } from "@/utils";
import i18next from "i18next";
import { useRef, useState } from "react";

interface Props {
  initialData?: { title: string; body: string };
  onSubmit: (title: string, body: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  submitButtonText: string;
}

export function FragmentForm({
  onSubmit,
  isLoading,
  onCancel,
  submitButtonText,
  initialData
}: Props) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [body, setBody] = useState(initialData?.body ?? "");

  const form = useRef<HTMLFormElement>(null);
  return (
    <Form
      ref={form}
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!form.current?.checkValidity()) {
          return;
        }
        onSubmit(title, body);
      }}
    >
      <div className="mb-4">
        <label>{i18next.t("fragments.form-title")}</label>
        <FormControl
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required={true}
          type="text"
          maxLength={255}
          autoFocus={true}
          onInvalid={(e: any) => handleInvalid(e, "fragments.", "validation-title")}
          onInput={handleOnInput}
        />
      </div>
      <div className="mb-4">
        <label>{i18next.t("fragments.form-body")}</label>
        <FormControl
          onInvalid={(e: any) => handleInvalid(e, "fragments.", "validation-value")}
          onInput={handleOnInput}
          type="textarea"
          style={{ height: "300px" }}
          value={body}
          onChange={(e: any) => setBody(e.target.value)}
          required={true}
          maxLength={5000}
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button appearance="gray" disabled={isLoading} onClick={onCancel}>
          {i18next.t("g.back")}
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {submitButtonText}
        </Button>
      </div>
    </Form>
  );
}
