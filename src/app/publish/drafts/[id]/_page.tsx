"use client";

import "../../page.scss";

import { PublishActionBar, PublishEditor, PublishValidatePost } from "@/app/publish/_components";
import { usePublishEditor, usePublishState } from "@/app/publish/_hooks";
import { useApiDraftDetector } from "@/app/submit/_hooks";
import { Button } from "@/features/ui";
import { UilFileEditAlt } from "@tooni/iconscout-unicons-react";
import { AnimatePresence } from "framer-motion";
import i18next from "i18next";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useSaveDraftApi } from "../../_api";
import { PublishEditorHtmlWarning } from "../../_components/publish-editor-html-warning";
import { PublishSuccessState } from "../../_components/publish-success-state";
import { PublishDraftsNoDraft } from "./_components";

export default function PublishPage() {
  const params = useParams();

  const [step, setStep] = useState<"edit" | "validation" | "scheduled" | "published" | "no-draft">(
    "edit"
  );
  const [showHtmlWarning, setShowHtmlWarning] = useState(false);

  const { editor, setEditorContent } = usePublishEditor(() => setShowHtmlWarning(true));

  const { setTitle, setContent, setTags, setPublishingVideo } = usePublishState();

  const { mutateAsync: saveToDraft, isPending: isDraftPending } = useSaveDraftApi();

  useApiDraftDetector(
    params.id as string,
    (draft) => {
      setTitle(draft.title);
      setContent(draft.body);
      setTags(draft.tags_arr);

      setEditorContent(draft.body);
      setPublishingVideo(draft.meta?.video);
    },
    () => setStep("no-draft")
  );

  return (
    <>
      <AnimatePresence>
        {step === "edit" && (
          <>
            <div className="container text-right max-w-[800px] mx-auto text-gray-600 dark:text-gray-400 text-xs p-2 md:p-0">
              {i18next.t("publish.draft-mode")}
            </div>
            <PublishActionBar onPublish={() => setStep("validation")}>
              <Button
                appearance="gray"
                size="sm"
                disabled={isDraftPending}
                onClick={() => saveToDraft()}
              >
                {i18next.t("publish.update-draft")}
              </Button>
            </PublishActionBar>
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
        {step === "no-draft" && <PublishDraftsNoDraft />}
      </AnimatePresence>
      <PublishEditorHtmlWarning show={showHtmlWarning} setShow={setShowHtmlWarning} />
    </>
  );
}
