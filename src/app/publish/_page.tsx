"use client";

import { PublishActionBar, PublishEditor, PublishValidatePost } from "@/app/publish/_components";
import { usePublishEditor } from "@/app/publish/_hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PublishEditorHtmlWarning } from "./_components/publish-editor-html-warning";
import { PublishSuccessState } from "./_components/publish-success-state";

export default function Publish() {
  const [step, setStep] = useState<"edit" | "validation" | "scheduled" | "published">("edit");
  const [showHtmlWarning, setShowHtmlWarning] = useState(false);

  const { editor } = usePublishEditor(() => setShowHtmlWarning(true));
  const router = useRouter();

  return (
    <>
      {step === "edit" && (
        <>
          <PublishActionBar
            onPublish={() => setStep("validation")}
            onBackToClassic={() => router.push("/submit")}
          />
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

      <PublishEditorHtmlWarning show={showHtmlWarning} setShow={setShowHtmlWarning} />
    </>
  );
}
