import { FormControl } from "@/features/ui";
import { usePublishState } from "../_hooks";
import i18next from "i18next";

export function PublishValidatePostMeta() {
  const { title, metaDescription, setMetaDescription } = usePublishState();

  return (
    <div className="flex flex-col gap-2">
      <FormControl className="text-sm" type="text" disabled={true} value={title} />
      <FormControl
        className="text-sm"
        placeholder={i18next.t("publish.preview-subtitle")}
        type="textarea"
        value={metaDescription}
        onChange={(e) => setMetaDescription((e.target as HTMLTextAreaElement).value)}
      />
    </div>
  );
}
