"use client";

import {
  PublishActionBar,
  PublishEditor,
  PublishValidatePost,
  PublishMultiTabWarning
} from "@/app/publish/_components";
import { usePublishAutosave, usePublishEditor, usePublishState } from "@/app/publish/_hooks";
import { isCommunity } from "@/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import i18next from "i18next";
import { PublishEditorHtmlWarning } from "./_components/publish-editor-html-warning";
import { PublishSuccessState } from "./_components/publish-success-state";

export default function Publish() {
  const [step, setStep] = useState<"edit" | "validation" | "scheduled" | "published">("edit");
  const [showHtmlWarning, setShowHtmlWarning] = useState(false);

  const { editor } = usePublishEditor(() => setShowHtmlWarning(true));
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tags, setTags } = usePublishState();
  const appliedCommunityRef = useRef<string | null>(null);

  const { isActiveTab, lastSaved, draftId } = usePublishAutosave();

  useEffect(() => {
    const communityParam = searchParams?.get("com");

    if (!communityParam || !isCommunity(communityParam)) {
      appliedCommunityRef.current = null;
      return;
    }

    const normalizedCommunity = communityParam.toLowerCase();

    if (appliedCommunityRef.current === normalizedCommunity) {
      return;
    }

    if (tags?.[0]?.toLowerCase() === normalizedCommunity) {
      appliedCommunityRef.current = normalizedCommunity;
      return;
    }

    const remainingTags = (tags ?? [])
      .filter((tag) => tag.toLowerCase() !== normalizedCommunity)
      .filter((tag) => !isCommunity(tag));

    setTags([normalizedCommunity, ...remainingTags]);
    appliedCommunityRef.current = normalizedCommunity;
  }, [searchParams, setTags, tags]);

  return (
    <>
      <PublishMultiTabWarning isActiveTab={isActiveTab} />
      {step === "edit" && (
        <>
          <div className="container max-w-[1024px] mx-auto text-xs text-gray-600 dark:text-gray-400 p-2 md:p-0">
            <div className="flex flex-wrap justify-between items-center">
              <span>{i18next.t("publish.new-content")}</span>
              {lastSaved && draftId && (
                <span className="text-gray-500 dark:text-gray-400">
                  {i18next.t("publish.auto-save")}: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
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
