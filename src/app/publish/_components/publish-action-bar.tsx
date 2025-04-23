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
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSaveDraftApi } from "../_api";
import { usePublishState } from "../_hooks";
import { PublishActionBarCommunity } from "./publish-action-bar-community";

interface Props {
  onPublish: () => void;
}

export function PublishActionBar({ onPublish }: Props) {
  const router = useRouter();

  const { schedule: scheduleDate, clearAll } = usePublishState();

  const [showReward, setShowReward] = useState(false);
  const [showBeneficiaries, setShowBeneficiaries] = useState(false);
  const [showMetaInfo, setShowMetaInfo] = useState(false);
  const [schedule, setSchedule] = useState(false);

  const pathname = usePathname();

  const { mutateAsync: saveToDraft, isPending: isDraftPending } = useSaveDraftApi();
  const [_, setShowGuide] = useSynchronizedLocalStorage(PREFIX + "_pub_onboarding_passed", true);

  return (
    <motion.div
      initial={{ opacity: 0, y: -32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -32 }}
      transition={{ delay: 0.4 }}
      className="container relative z-[11] justify-between gap-4 px-2 md:px-4 flex items-center max-w-[800px] py-4 mx-auto publish-action-bar"
    >
      <PublishActionBarCommunity />
      <div className="flex items-center gap-4">
        <LoginRequired>
          <Button appearance={scheduleDate ? "primary" : "success"} onClick={onPublish}>
            {i18next.t(scheduleDate ? "submit.schedule" : "submit.publish")}
          </Button>
        </LoginRequired>

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
              label="Reward settings"
            />
            <DropdownItemWithIcon
              onClick={() => setShowBeneficiaries(true)}
              icon={<UilUsersAlt />}
              label="Beneficiaries"
            />
            <DropdownItemWithIcon
              onClick={() => setShowMetaInfo(true)}
              icon={<UilDocumentInfo />}
              label="Meta information"
            />
            <div className="border-b border-[--border-color] h-[1px] w-full" />
            <DropdownItemWithIcon
              disabled={isDraftPending}
              icon={<UilFileEditAlt />}
              label={
                pathname.includes("drafts")
                  ? i18next.t("publish.update-draft")
                  : i18next.t("publish.save-draft")
              }
              onClick={() => saveToDraft({})}
            />
            <DropdownItemWithIcon
              selected={!!scheduleDate}
              onClick={() => setSchedule(true)}
              icon={<UilClock />}
              label={i18next.t("publish.schedule")}
            />
            <DropdownItemWithIcon
              className="!text-red"
              icon={<UilTrash />}
              label={i18next.t("publish.clear")}
              onClick={clearAll}
            />
            <div className="border-b border-[--border-color] h-[1px] w-full" />
            <DropdownItemWithIcon
              label={i18next.t("publish.back-to-old")}
              onClick={() => router.push("/submit")}
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
