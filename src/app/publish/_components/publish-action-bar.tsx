"use client";

import { PublishBeneficiariesDialog } from "@/app/publish/_components/publish-beneficiaries-dialog";
import { PublishMetaInfoDialog } from "@/app/publish/_components/publish-meta-info-dialog";
import { PublishRewardsDialog } from "@/app/publish/_components/publish-rewards-dialog";
import { PublishScheduleDialog } from "@/app/publish/_components/publish-schedule-dialog";
import {
  UilClock,
  UilDocumentInfo,
  UilEllipsisV,
  UilFileEditAlt,
  UilMoneybag,
  UilTrash,
  UilUsersAlt
} from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { motion } from "framer-motion";
import i18next from "i18next";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSaveDraftApi } from "../_api";
import { usePublishState } from "../_hooks";
import { PublishActionBarCommunity } from "./publish-action-bar-community";

interface Props {
  onPublish: () => void;
}

export function PublishActionBar({ onPublish }: Props) {
  const { schedule: scheduleDate } = usePublishState();

  const [showReward, setShowReward] = useState(false);
  const [showBeneficiaries, setShowBeneficiaries] = useState(false);
  const [showMetaInfo, setShowMetaInfo] = useState(false);
  const [schedule, setSchedule] = useState(false);

  const pathname = usePathname();
  const { mutateAsync: saveToDraft, isPending: isDraftPending } = useSaveDraftApi();

  return (
    <motion.div
      initial={{ opacity: 0, y: -32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -32 }}
      transition={{ delay: 0.4 }}
      className="container relative z-[11] justify-between gap-4 pl-2 md:pl-4 flex items-center max-w-[800px] py-4 mx-auto publish-action-bar"
    >
      <PublishActionBarCommunity />
      <div className="flex items-center gap-4">
        <Button appearance={scheduleDate ? "primary" : "success"} onClick={onPublish}>
          {i18next.t(scheduleDate ? "submit.schedule" : "submit.publish")}
        </Button>
        <Dropdown>
          <DropdownToggle>
            <Button icon={<UilEllipsisV />} appearance="gray-link" />
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
              label="Schedule"
            />
            <DropdownItemWithIcon className="!text-red" icon={<UilTrash />} label="Clear" />
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
