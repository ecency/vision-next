"use client";

import { v4 as uuidv4 } from "uuid";
import { PublishActionBar, PublishEditor, PublishValidatePost } from "@/app/publish/_components";
import { usePublishEditor, usePublishState } from "@/app/publish/_hooks";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { PublishSuccessState } from "./_components/publish-success-state";
import { PublishEditorHtmlWarning } from "./_components/publish-editor-html-warning";
import { useRouter, useParams } from "next/navigation";

export default function Publish() {
  const [step, setStep] = useState<"edit" | "validation" | "scheduled" | "published">("edit");
  const [showHtmlWarning, setShowHtmlWarning] = useState(false);

  const { editor } = usePublishEditor(() => setShowHtmlWarning(true));
  const router = useRouter();

  const { sessionId, setSessionId, clearAll } = usePublishState();
  const params = useParams();

  useEffect(() => {
    const isDraft = Boolean(params?.id);

    if (!isDraft && !sessionId) {
      clearAll();              // ✅ only clear for NEW posts
      setSessionId(uuidv4());  // ✅ only create session for NEW posts
    }
  }, []);

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
