"use client";

import { PublishEditor } from "@/app/publish/_components";
import { usePublishEditor, usePublishState } from "@/app/publish/_hooks";
import { useEntryDetector } from "@/app/submit/_hooks";
import { Entry } from "@/entities";
import { delay } from "@/utils";
import { postBodySummary } from "@ecency/render-helper";
import { AnimatePresence } from "framer-motion";
import i18next from "i18next";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  PublishEntryActionBar,
  PublishEntryLoadingPost,
  PublishEntryNoPost,
  PublishEntrySuccessState,
  PublishEntryValidateEdit
} from "./_components";
import { PublishEditorHtmlWarning } from "@/app/publish/_components/publish-editor-html-warning";

export default function Publish() {
  const params = useParams();

  const [step, setStep] = useState<"loading" | "edit" | "no-post" | "validation" | "updated">(
    "loading"
  );
  const [entry, setEnrty] = useState<Entry>();
  const [showHtmlWarning, setShowHtmlWarning] = useState(false);

  const { editor, setEditorContent } = usePublishEditor(() => setShowHtmlWarning(true));

  const { setTitle, setContent, setTags, setMetaDescription, setSelectedThumbnail, setLocation } =
    usePublishState();

  useEntryDetector(
    (params?.author as string).replace("%40", ""),
    params?.permlink as string,
    async (entry) => {
      await delay(2000);

      if (entry) {
        setEnrty(entry);
        setStep("edit");
        setTitle(entry.title);
        setTags(Array.from(new Set(entry.json_metadata?.tags ?? [])));
        setContent(entry.body); // todo
        setMetaDescription(entry.json_metadata?.description ?? postBodySummary(entry.body, 200));
        entry?.json_metadata?.image && setSelectedThumbnail(entry?.json_metadata?.image[0]);
        entry?.json_metadata?.location && setLocation(entry?.json_metadata?.location);

        setEditorContent(entry.body);
      } else {
        setStep("no-post");
      }
    }
  );

  return (
    <>
      <AnimatePresence>
        {step === "edit" && (
          <>
            <div className="container text-right max-w-[800px] mx-auto text-gray-600 dark:text-gray-400 text-xs p-2 md:p-0">
              {i18next.t("publish.edit-mode")}
            </div>
            <PublishEntryActionBar onEdit={() => setStep("validation")} />
            <PublishEditor editor={editor} />
          </>
        )}
        {step === "validation" && (
          <PublishEntryValidateEdit
            entry={entry}
            onClose={() => setStep("edit")}
            onSuccess={(step) => setStep(step)}
          />
        )}
        {step === "no-post" && <PublishEntryNoPost />}
        {step === "loading" && <PublishEntryLoadingPost />}
        {step === "updated" && <PublishEntrySuccessState />}
      </AnimatePresence>
      <PublishEditorHtmlWarning show={showHtmlWarning} setShow={setShowHtmlWarning} />
    </>
  );
}
