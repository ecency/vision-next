"use client";

import { PublishBeneficiariesDialog } from "@/app/publish/_components/publish-beneficiaries-dialog";
import { PublishMetaInfoDialog } from "@/app/publish/_components/publish-meta-info-dialog";
import { PublishRewardsDialog } from "@/app/publish/_components/publish-rewards-dialog";
import { PublishScheduleDialog } from "@/app/publish/_components/publish-schedule-dialog";
import { LoginRequired } from "@/features/shared";
import { StyledTooltip } from "@/features/ui";
import { useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import {
  UilClock,
  UilDocumentInfo,
  UilEllipsisV,
  UilFileEditAlt,
  UilMoneybag,
  UilQuestionCircle,
  UilTrash,
  UilUsersAlt
} from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { motion } from "framer-motion";
import i18next from "i18next";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useState } from "react";
import { useSaveDraftApi } from "../_api";
import { useDefaultBeneficiary, usePublishState } from "../_hooks";
import { PublishActionBarCommunity } from "./publish-action-bar-community";

interface Props {
  onPublish: () => void;
  onBackToClassic: () => void;
  draftId?: string;
}

export function PublishActionBar({
  onPublish,
  children,
  onBackToClassic,
  draftId
}: PropsWithChildren<Props>) {
  const { schedule: scheduleDate, clearAll, title } = usePublishState();

  const [showReward, setShowReward] = useState(false);
  const [showBeneficiaries, setShowBeneficiaries] = useState(false);
  const [showMetaInfo, setShowMetaInfo] = useState(false);
  const [schedule, setSchedule] = useState(false);

  const pathname = usePathname();

  useDefaultBeneficiary();

  const { mutateAsync: saveToDraft, isPending: isDraftPending } = useSaveDraftApi(draftId);
  const [_, setShowGuide] = useSynchronizedLocalStorage(PREFIX + "_pub_onboarding_passed", true);

  return (
    <motion.div
      initial={{ opacity: 0, y: -32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -32 }}
      transition={{ delay: 0.4 }}
      className="container relative z-[11] justify-between gap-4 px-2 md:px-4 flex flex-col-reverse sm:flex-row sm:items-center max-w-[1024px] py-4 mx-auto publish-action-bar"
    >
      <PublishActionBarCommunity />
      <div className="w-full sm:w-auto flex justify-end sm:justify-normal items-center gap-2 sm:gap-4">
        <LoginRequired>
          <Button size="sm" appearance={scheduleDate ? "primary" : "success"} onClick={onPublish}>
            {i18next.t("g.continue")}
          </Button>
        </LoginRequired>
        {children}

        <Button
          size="sm"
          disabled={isDraftPending || !title?.trim()}
          appearance="gray-link"
          onClick={() => saveToDraft()}
        >
          {pathname?.includes("drafts")
            ? i18next.t("publish.update-draft")
            : i18next.t("publish.save-draft")}
        </Button>
        {!pathname?.includes("drafts") && (
          <StyledTooltip content={i18next.t("publish.clear")}>
            <Button
              noPadding={true}
              appearance="gray-link"
              icon={<UilTrash />}
              onClick={clearAll}
            />
          </StyledTooltip>
        )}

        <StyledTooltip content={i18next.t("publish.get-help")}>
          <Button
            noPadding={true}
            appearance="gray-link"
            icon={<UilQuestionCircle />}
            onClick={() => setShowGuide(true)}
          />
        </StyledTooltip>
        <Dropdown>
          <DropdownToggle>
            <Button noPadding={true} icon={<UilEllipsisV />} appearance="gray-link" />
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
            <div className="border-b border-[--border-color] h-[1px] w-full" />
            <DropdownItemWithIcon
              selected={!!scheduleDate}
              onClick={() => setSchedule(true)}
              icon={<UilClock />}
              label={i18next.t("publish.schedule")}
            />
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
    </motion.div>
  );
}
