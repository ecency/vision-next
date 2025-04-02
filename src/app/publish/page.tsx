"use client";

import { EditorContent } from "@tiptap/react";
import "./page.scss";

import {
  PublishActionBar,
  PublishEditorToolbar,
  PublishValidatePost
} from "@/app/publish/_components";
import { usePublishEditor } from "@/app/publish/_hooks";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { PublishSuccessState } from "./_components/publish-success-state";
import { PublishEditorPollEditor } from "./_editor-extensions";
import Link from "next/link";
import i18next from "i18next";
import { Alert, Button } from "@/features/ui";
import { useLocalStorage } from "react-use";
import { PREFIX } from "@/utils/local-storage";

export default function PublishPage() {
  const editor = usePublishEditor();

  const [step, setStep] = useState<"edit" | "validation" | "scheduled" | "published">("edit");
  const [showBackToSubmit, setShowBackToSubmit] = useLocalStorage(PREFIX + "_pub_back_old", true);

  return (
    <AnimatePresence>
      {step === "edit" && (
        <>
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

          <div className="publish-page max-w-[800px] rounded-2xl bg-white container mx-auto mt-4">
            <PublishEditorPollEditor />

            {showBackToSubmit && (
              <div className="p-4">
                <Alert className="w-full justify-between flex items-center">
                  {i18next.t("publish.back-to-old")}
                  <div className="flex gap-4">
                    <Link href="/submit">
                      <Button size="sm">{i18next.t("g.back")}</Button>
                    </Link>
                    <Button
                      onClick={() => setShowBackToSubmit(false)}
                      size="sm"
                      appearance="gray-link"
                    >
                      {i18next.t("g.close")}
                    </Button>
                  </div>
                </Alert>
              </div>
            )}
          </div>

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
    </AnimatePresence>
  );
}
