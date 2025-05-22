import { EcencyConfigManager } from "@/config";
import { FragmentsDialog } from "@/features/shared/fragments";
import { parseAllExtensionsToDoc } from "@/features/tiptap-editor";
import { Editor } from "@tiptap/core";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { PublishEditorHtmlWarning } from "./publish-editor-html-warning";
import { useCallback, useState } from "react";

interface Props {
  showFragments: boolean;
  setShowFragments: (v: boolean) => void;
  editor: Editor | null;
}

export function PublishEditorToolbarFragments({ showFragments, setShowFragments, editor }: Props) {
  const [showWarning, setShowWarning] = useState(false);

  const onPick = useCallback(
    (e: string) => {
      if (/<[a-z]+>.*<\/[a-z]+>/gm.test(e)) {
        setShowFragments(false);
        setShowWarning(true);
        return;
      }

      editor
        ?.chain()
        .focus()
        .insertContent(parseAllExtensionsToDoc(DOMPurify.sanitize(marked.parse(e) as string)))
        .run();
      setShowFragments(false);
    },
    [editor, setShowFragments]
  );

  return (
    <EcencyConfigManager.Conditional
      condition={({ visionFeatures }) => visionFeatures.fragments.enabled}
    >
      <FragmentsDialog show={showFragments} setShow={setShowFragments} onPick={onPick} />

      <PublishEditorHtmlWarning show={showWarning} setShow={setShowWarning} />
    </EcencyConfigManager.Conditional>
  );
}
