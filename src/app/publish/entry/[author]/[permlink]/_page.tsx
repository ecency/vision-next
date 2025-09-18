"use client";

import { PublishEditor } from "@/app/publish/_components";
import { usePublishEditor, usePublishState } from "@/app/publish/_hooks";
import { useEntryDetector } from "@/app/submit/_hooks";
import { Entry } from "@/entities";
import { postBodySummary } from "@ecency/render-helper";
import { SUBMIT_DESCRIPTION_MAX_LENGTH } from "@/app/submit/_consts";
import { AnimatePresence } from "framer-motion";
import i18next from "i18next";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { normalizePollSnapshot } from "@/app/publish/_utils/poll";
import { useEntryPollExtractor } from "@/features/polls";
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

  const {
    setTitle,
    setContent,
    setTags,
    setMetaDescription,
    setSelectedThumbnail,
    setLocation,
    setEntryImages,
    setPoll,
    clearAll
  } = usePublishState();

  const entryPoll = useEntryPollExtractor(entry);

  useEffect(() => {
    setPoll(normalizePollSnapshot(entryPoll));
  }, [entryPoll, setPoll]);

  useEntryDetector(
    (params?.author as string).replace("%40", ""),
    params?.permlink as string,
    async (entry) => {
      if (entry) {
        clearAll();
        setEnrty(entry);
        setStep("edit");
        setTitle(entry.title);
        setTags(Array.from(new Set(entry.json_metadata?.tags ?? [])));
        setContent(entry.body); // todo
        setMetaDescription(
          entry.json_metadata?.description ??
            postBodySummary(entry.body, SUBMIT_DESCRIPTION_MAX_LENGTH)
        );
        entry?.json_metadata?.image && setSelectedThumbnail(entry?.json_metadata?.image[0]);
        entry?.json_metadata?.image &&
          setEntryImages(Array.from(new Set(entry.json_metadata?.image)));
        entry?.json_metadata?.location && setLocation(entry?.json_metadata?.location);

        setEditorContent(entry.body);
      } else {
        clearAll();
        setStep("no-post");
      }
    }
  );

  return (
    <>
      <AnimatePresence>
        {step === "edit" && (
          <>
            <div className="container max-w-[1024px] mx-auto text-xs text-gray-600 dark:text-gray-400 p-2 md:p-0">
              <div className="flex flex-wrap justify-between items-center">
                <span>{i18next.t("publish.edit-mode")}</span>
              </div>
            </div>
            <PublishEntryActionBar entry={entry} onEdit={() => setStep("validation")} />
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
        {step === "updated" && <PublishEntrySuccessState entry={entry} />}
      </AnimatePresence>
      <PublishEditorHtmlWarning show={showHtmlWarning} setShow={setShowHtmlWarning} />
    </>
  );
}
