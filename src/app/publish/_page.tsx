"use client";

import { PublishActionBar, PublishEditor, PublishValidatePost } from "@/app/publish/_components";
import { usePublishEditor } from "@/app/publish/_hooks";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { PublishSuccessState } from "./_components/publish-success-state";
import { PublishEditorHtmlWarning } from "./_components/publish-editor-html-warning";

export default function Publish() {
  const [step, setStep] = useState<"edit" | "validation" | "scheduled" | "published">("edit");
  const [showHtmlWarning, setShowHtmlWarning] = useState(false);

  const { editor } = usePublishEditor(() => setShowHtmlWarning(true));

  return (
    <>
      <AnimatePresence>
        {step === "edit" && (
          <>
            <PublishActionBar onPublish={() => setStep("validation")} />
            <PublishEditor editor={editor} />
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
      <PublishEditorHtmlWarning show={showHtmlWarning} setShow={setShowHtmlWarning} />
    </>
  );
}
