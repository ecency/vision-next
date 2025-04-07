"use client";

import { EditorContent } from "@tiptap/react";
import "../../page.scss";

import {
  PublishActionBar,
  PublishEditorToolbar,
  PublishValidatePost
} from "@/app/publish/_components";
import { usePublishEditor, usePublishState } from "@/app/publish/_hooks";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { PublishSuccessState } from "../../_components/publish-success-state";
import { useApiDraftDetector } from "@/app/submit/_hooks";
import { useParams } from "next/navigation";
import { PublishDraftsNoDraft } from "./_components";
import { error } from "@/features/shared";
import i18next from "i18next";

export default function PublishPage() {
  const editor = usePublishEditor();

  const params = useParams();

  const [step, setStep] = useState<"edit" | "validation" | "scheduled" | "published" | "no-draft">(
    "edit"
  );
  const [draftId, setDraftId] = useState<string>();

  const { setTitle, setContent, setTags } = usePublishState();

  useApiDraftDetector(
    params.id as string,
    (draft) => {
      setTitle(draft.title);
      setContent(draft.body);
      setTags(draft.tags_arr);
      setDraftId(draft._id);

      try {
        editor
          ?.chain()
          .setContent(
            `${draft.title ?? "# Hello Ecency member,"}\n\n ${draft.body ?? "Tell your story..."}`
          )
          .run();
      } catch (e) {
        error("Failed to load local draft. We are working on it");
        throw e;
      }
    },
    () => setStep("no-draft")
  );

  return (
    <AnimatePresence>
      {step === "edit" && (
        <>
          <div className="container text-right max-w-[800px] mx-auto text-gray-600 dark:text-gray-400 text-xs">
            {i18next.t("publish.draft-mode")}
          </div>
          <PublishActionBar onPublish={() => setStep("validation")} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="publish-page max-w-[800px] rounded-2xl bg-white container mx-auto px-2"
          >
            <div className="publish-page-editor-toolbar-container border-b border-[--border-color] sticky top-[60px] md:top-[76px] -mx-2 rounded-t-2xl z-10 bg-white">
              <PublishEditorToolbar editor={editor} />
            </div>
            <EditorContent editor={editor} className="markdown-view p-2 md:p-4 xl:p-6 font-serif" />
          </motion.div>
          <PublishActionBar onPublish={() => setStep("validation")} />
        </>
      )}
      {step === "validation" && (
        <PublishValidatePost
          onClose={() => setStep("edit")}
          onSuccess={(step) => {
            setStep(step);
          }}
        />
      )}
      {["scheduled", "published"].includes(step) && (
        <PublishSuccessState
          step={step as "published" | "scheduled"}
          setEditStep={() => setStep("edit")}
        />
      )}
      {step === "no-draft" && <PublishDraftsNoDraft />}
    </AnimatePresence>
  );
}
