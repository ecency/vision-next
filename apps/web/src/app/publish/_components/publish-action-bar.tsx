"use client";

import { EcencyConfigManager } from "@/config";
import { LoginRequired } from "@/features/shared";
import dynamic from "next/dynamic";

const PublishBeneficiariesDialog = dynamic(
  () => import("@/app/publish/_components/publish-beneficiaries-dialog").then((m) => ({
    default: m.PublishBeneficiariesDialog
  })),
  { ssr: false }
);

const PublishMetaInfoDialog = dynamic(
  () => import("@/app/publish/_components/publish-meta-info-dialog").then((m) => ({
    default: m.PublishMetaInfoDialog
  })),
  { ssr: false }
);

const PublishRewardsDialog = dynamic(
  () => import("@/app/publish/_components/publish-rewards-dialog").then((m) => ({
    default: m.PublishRewardsDialog
  })),
  { ssr: false }
);

const PublishScheduleDialog = dynamic(
  () => import("@/app/publish/_components/publish-schedule-dialog").then((m) => ({
    default: m.PublishScheduleDialog
  })),
  { ssr: false }
);

const PublishImportDialog = dynamic(
  () => import("@/app/publish/_components/publish-import-dialog").then((m) => ({
    default: m.PublishImportDialog
  })),
  { ssr: false }
);

const PostTemplatesDialog = dynamic(
  () => import("@/features/shared/post-templates").then((m) => ({
    default: m.PostTemplatesDialog
  })),
  { ssr: false }
);
import { StyledTooltip } from "@/features/ui";
import { useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import {
  UilClock,
  UilDocumentInfo,
  UilEllipsisV,
  UilFileBookmarkAlt,
  UilFileImport,
  UilMoneybag,
  UilQuestionCircle,
  UilTrash,
  UilUsersAlt
} from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import i18next from "i18next";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useState } from "react";
import { useSaveDraftApi, useSaveTemplateApi } from "../_api";
import { useApplyTemplate, useDefaultBeneficiary, usePublishState } from "../_hooks";
import { useOptionalUploadTracker } from "../_hooks/use-upload-tracker";
import { PublishActionBarCommunity } from "./publish-action-bar-community";
import { hasPublishContent } from "../_utils/content";
import { Spinner } from "@ui/spinner";
import type { ImportResult } from "./publish-import-dialog";

interface Props {
  onPublish: () => void;
  onBackToClassic: () => void;
  onImport?: (result: ImportResult) => void;
  setEditorContent?: (content: string | undefined) => void;
  draftId?: string;
}

export function PublishActionBar({
  onPublish,
  children,
  onBackToClassic,
  onImport,
  setEditorContent,
  draftId
}: PropsWithChildren<Props>) {
  const { schedule: scheduleDate, clearAll, title, content } = usePublishState();

  const [showReward, setShowReward] = useState(false);
  const [showBeneficiaries, setShowBeneficiaries] = useState(false);
  const [showMetaInfo, setShowMetaInfo] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templatesMode, setTemplatesMode] = useState<"list" | "save">("list");

  const pathname = usePathname();

  useDefaultBeneficiary();

  const canContinue = !!title?.trim() && hasPublishContent(content);

  const { mutateAsync: saveToDraft, isPending: isDraftPending } = useSaveDraftApi(draftId);
  const { mutateAsync: saveTemplate, isPending: isTemplatePending } = useSaveTemplateApi();
  const applyTemplate = useApplyTemplate(setEditorContent);
  const uploadTracker = useOptionalUploadTracker();
  const [_, setShowGuide] = useSynchronizedLocalStorage(PREFIX + "_pub_onboarding_passed", true);

  return (
    <div className="container relative z-[11] justify-between gap-4 px-2 md:px-4 flex flex-col-reverse sm:flex-row sm:items-center max-w-[1024px] py-4 mx-auto publish-action-bar">
      {/* Left side of the bar is just the community selector. The mode label
          (New Content / Draft Editing / Post Editing) and the auto-saved time
          live in the PublishModeHeader rendered above the bar, so they are not
          duplicated here. */}
      <PublishActionBarCommunity />
      <div className="w-full sm:w-auto flex justify-end sm:justify-normal items-center gap-2 sm:gap-4">
        <LoginRequired promptOnAnon>
          <Button
            size="sm"
            appearance={scheduleDate ? "primary" : "success"}
            onClick={onPublish}
            disabled={!canContinue}
          >
            {i18next.t("g.continue")}
          </Button>
        </LoginRequired>
        {children}

        {uploadTracker?.hasPendingUploads && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Spinner className="w-3 h-3" />
            <span>{i18next.t("publish.uploading-images", { defaultValue: "Uploading..." })}</span>
          </div>
        )}

        <LoginRequired promptOnAnon>
          <Button
            size="sm"
            disabled={isDraftPending || !title?.trim()}
            appearance="gray-link"
            onClick={() => saveToDraft({ showToast: true })}
          >
            {pathname?.includes("drafts")
              ? i18next.t("publish.update-draft")
              : i18next.t("publish.save-draft")}
          </Button>
        </LoginRequired>
        {onImport && (
          <StyledTooltip content={i18next.t("publish.import")}>
            <Button
              noPadding={true}
              appearance="gray-link"
              icon={<UilFileImport />}
              onClick={() => setShowImport(true)}
              aria-label={i18next.t("publish.import")}
            />
          </StyledTooltip>
        )}
        <StyledTooltip content={i18next.t("publish.get-help")}>
          <Button
            noPadding={true}
            appearance="gray-link"
            icon={<UilQuestionCircle />}
            onClick={() => setShowGuide(true)}
            aria-label={i18next.t("publish.get-help")}
          />
        </StyledTooltip>
        <Dropdown>
          <DropdownToggle>
            <Button noPadding={true} icon={<UilEllipsisV />} appearance="gray-link" aria-label={i18next.t("g.menu", { defaultValue: "Menu" })} aria-haspopup="menu" />
          </DropdownToggle>
          <DropdownMenu align="right">
            <DropdownItemWithIcon
              onClick={() => setShowReward(true)}
              icon={<UilMoneybag />}
              label={i18next.t("publish.reward-settings")}
            />
            <DropdownItemWithIcon
              onClick={() => setShowBeneficiaries(true)}
              icon={<UilUsersAlt />}
              label={i18next.t("publish.beneficiaries")}
            />
            <DropdownItemWithIcon
              onClick={() => setShowMetaInfo(true)}
              icon={<UilDocumentInfo />}
              label={i18next.t("publish.meta-information")}
            />
            <EcencyConfigManager.Conditional
              condition={({ visionFeatures }) => visionFeatures.postTemplates.enabled}
            >
              <LoginRequired>
                <DropdownItemWithIcon
                  onClick={() => {
                    setTemplatesMode("list");
                    setShowTemplates(true);
                  }}
                  icon={<UilFileBookmarkAlt />}
                  label={i18next.t("post-templates.title")}
                />
              </LoginRequired>
              <LoginRequired>
                <DropdownItemWithIcon
                  onClick={() => {
                    setTemplatesMode("save");
                    setShowTemplates(true);
                  }}
                  icon={<UilFileBookmarkAlt />}
                  label={i18next.t("post-templates.save-current")}
                />
              </LoginRequired>
            </EcencyConfigManager.Conditional>
            <div className="border-b border-[--border-color] h-[1px] w-full" />
            <DropdownItemWithIcon
              selected={!!scheduleDate}
              onClick={() => setSchedule(true)}
              icon={<UilClock />}
              label={i18next.t("publish.schedule")}
            />
            {!pathname?.includes("drafts") && (
              <>
                <div className="border-b border-[--border-color] h-[1px] w-full" />
                <DropdownItemWithIcon
                  onClick={clearAll}
                  icon={<UilTrash />}
                  label={i18next.t("publish.clear")}
                />
              </>
            )}
            <div className="border-b border-[--border-color] h-[1px] w-full" />
            <DropdownItemWithIcon
              label={i18next.t("publish.back-to-old")}
              onClick={onBackToClassic}
            />
          </DropdownMenu>
        </Dropdown>
      </div>

      <PublishRewardsDialog show={showReward} setShow={setShowReward} />
      <PublishBeneficiariesDialog show={showBeneficiaries} setShow={setShowBeneficiaries} />
      <PublishMetaInfoDialog show={showMetaInfo} setShow={setShowMetaInfo} />
      <PublishScheduleDialog show={schedule} setShow={setSchedule} />
      {onImport && (
        <PublishImportDialog show={showImport} setShow={setShowImport} onImport={onImport} />
      )}
      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.postTemplates.enabled}
      >
        <PostTemplatesDialog
          show={showTemplates}
          setShow={setShowTemplates}
          onApply={applyTemplate}
          onSaveCurrent={(name) => saveTemplate({ name })}
          isSaving={isTemplatePending}
          confirmApply={!!title?.trim() || hasPublishContent(content)}
          initialMode={templatesMode}
          canSaveCurrent={!!title?.trim() || hasPublishContent(content)}
        />
      </EcencyConfigManager.Conditional>
    </div>
  );
}
