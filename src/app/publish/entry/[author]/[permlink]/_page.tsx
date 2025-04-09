"use client";

import { EditorContent } from "@tiptap/react";

import { PublishEditorToolbar } from "@/app/publish/_components";
import { usePublishEditor, usePublishState } from "@/app/publish/_hooks";
import { useEntryDetector } from "@/app/submit/_hooks";
import { Entry } from "@/entities";
import { delay } from "@/utils";
import { postBodySummary } from "@ecency/render-helper";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  PublishEntryActionBar,
  PublishEntryLoadingPost,
  PublishEntryNoPost,
  PublishEntryValidateEdit,
  PublishEntrySuccessState
} from "./_components";

export function Publish() {
  const editor = usePublishEditor();

  const params = useParams();

  const [step, setStep] = useState<"loading" | "edit" | "no-post" | "validation" | "updated">(
    "loading"
  );
  const [entry, setEnrty] = useState<Entry>();

  const { setTitle, setContent, setTags, setMetaDescription, setSelectedThumbnail } =
    usePublishState();

  useEntryDetector(
    (params.author as string).replace("%40", ""),
    params.permlink as string,
    async (entry) => {
      await delay(2000);

      if (entry) {
        setEnrty(entry);
        setStep("edit");
        setTitle(entry.title);
        setTags(Array.from(new Set(entry.json_metadata?.tags ?? [])));
        setContent(entry.body);
        setMetaDescription(entry.json_metadata?.description ?? postBodySummary(entry.body, 200));
        entry?.json_metadata?.image && setSelectedThumbnail(entry?.json_metadata?.image[0]);
      } else {
        setStep("no-post");
      }
    }
  );

  return (
    <AnimatePresence>
      {step === "edit" && (
        <>
          <div className="container text-right max-w-[800px] mx-auto text-gray-600 dark:text-gray-400 text-xs p-2 md:p-0">
            {i18next.t("publish.edit-mode")}
          </div>
          <PublishEntryActionBar onEdit={() => setStep("validation")} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="publish-page max-w-[800px] rounded-2xl bg-white container mx-auto px-2"
          >
            <div className="publish-page-editor-toolbar-container border-b border-[--border-color] sticky top-[60px] md:top-[76px] -mx-2 rounded-t-2xl z-10 bg-white">
              <PublishEditorToolbar editor={editor} allowToUploadVideo={false} />
            </div>
            <EditorContent editor={editor} className="markdown-view p-2 md:p-4 xl:p-6 font-serif" />
          </motion.div>
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
  );
}
