"use client";

import "../../page.scss";

import { PublishActionBar, PublishEditor, PublishValidatePost } from "@/app/publish/_components";
import { usePublishEditor, usePublishState, useAutoSavePublishDraft } from "@/app/publish/_hooks";
import { useApiDraftDetector } from "@/app/submit/_hooks";
import { Button } from "@/features/ui";
import { AnimatePresence } from "framer-motion";
import i18next from "i18next";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useSaveDraftApi } from "../../_api";
import { PublishEditorHtmlWarning } from "../../_components/publish-editor-html-warning";
import { PublishSuccessState } from "../../_components/publish-success-state";
import { PublishDraftsNoDraft } from "./_components";

export default function PublishPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params?.id as string | undefined;

  const [step, setStep] = useState<"edit" | "validation" | "scheduled" | "published" | "no-draft">(
    "edit"
  );
  const [showHtmlWarning, setShowHtmlWarning] = useState(false);

  const { editor, setEditorContent } = usePublishEditor(() => setShowHtmlWarning(true));
  const { setTitle, setContent, setTags, setPublishingVideo, setLocation } = usePublishState();

  const { mutateAsync: saveToDraft, isPending: isDraftPending } = useSaveDraftApi(draftId);

  useApiDraftDetector(
    params?.id as string,
    (draft) => {
      setTitle(draft.title);
      setContent(draft.body);
      setTags(draft.tags_arr);

      setEditorContent(draft.body);
      setPublishingVideo(draft.meta?.video);
      setLocation(draft.meta?.location);
    },
    () => setStep("no-draft")
  );
  const lastSaved = useAutoSavePublishDraft(step, draftId);

  return (
    <>
      <AnimatePresence>
        {step === "edit" && (
          <>
            <div className="container max-w-[800px] mx-auto text-xs text-gray-600 dark:text-gray-400 p-2 md:p-0">
              <div className="flex flex-wrap justify-between items-center">
                <span>{i18next.t("publish.draft-mode")}</span>
                {lastSaved && (
                  <span className="text-gray-500 dark:text-gray-400">
                    {i18next.t("publish.auto-save")}: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <PublishActionBar
              onPublish={() => setStep("validation")}
              onBackToClassic={() => router.push(`/draft/${params?.id}`)}
            >
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
