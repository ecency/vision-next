"use client";

import { PublishActionBar, PublishEditor, PublishValidatePost } from "@/app/publish/_components";
import { usePublishEditor } from "@/app/publish/_hooks";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { PublishSuccessState } from "./_components/publish-success-state";

export default function Publish() {
  const { editor } = usePublishEditor();

  const [step, setStep] = useState<"edit" | "validation" | "scheduled" | "published">("edit");

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
    </>
  );
}
