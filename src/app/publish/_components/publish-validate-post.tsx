"use client";

import { TagSelector } from "@/app/submit/_components";
import { getCommunityCache } from "@/core/caches";
import { UserAvatar } from "@/features/shared";
import { Button } from "@/features/ui";
import { isCommunity } from "@/utils";
import { UilMultiply } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";
import { useCallback, useMemo, useState } from "react";
import { usePublishState } from "../_hooks";
import { PublishValidatePostThumbnailPicker } from "./publish-validate-post-thumbnail-picker";
import { PublishScheduleDialog } from "./publish-schedule-dialog";
import { PublishValidatePostMeta } from "./publish-validate-post-meta";
import { usePublishApi, useScheduleApi } from "../_api";

interface Props {
  onClose: () => void;
  onSuccess: (step: "published" | "scheduled") => void;
}

export function PublishValidatePost({ onClose, onSuccess }: Props) {
  const { title, metaDescription, tags, setTags, schedule, selectedThumbnail, clearAll } =
    usePublishState();

  const [showSchedule, setShowSchedule] = useState(false);

  const communityTag = useMemo(() => tags?.find((t) => isCommunity(t)), [tags]);
  const { data: community } = getCommunityCache(communityTag).useClientQuery();

  const { mutateAsync: publishNow, isPending: isPublishPending } = usePublishApi();
  const { mutateAsync: scheduleNow, isPending: isSchedulePending } = useScheduleApi();

  const submit = useCallback(async () => {
    if (schedule) {
      await scheduleNow();

      onSuccess("scheduled");
    } else {
      await publishNow();

      onSuccess("published");
    }

    clearAll();
  }, [
    clearAll,
    metaDescription,
    onSuccess,
    publishNow,
    schedule,
    scheduleNow,
    selectedThumbnail,
    tags,
    title
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="publish-page max-w-[1024px] mx-auto"
    >
      <div className="col-span-2 justify-end flex p-4">
        <Button
          appearance="gray"
          icon={<UilMultiply />}
          size="sm"
          className="h-[36px]"
          onClick={onClose}
        />
      </div>
      <div className="px-2 py-4 sm:px-4 md:p-6 lg:p-8 bg-white rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
        <div className="flex flex-col gap-4">
          <div className="text-lg font-semibold mb-4">{i18next.t("publish.story-preview")}</div>
          <PublishValidatePostThumbnailPicker />
          <PublishValidatePostMeta />
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {i18next.t("publish.public-info-hint")}
          </div>
        </div>
        <div className="flex flex-col gap-4 md:gap-6 lg:gap-8 items-start">
          <div className="flex items-center gap-2">
            <span className="opacity-75">{i18next.t("decks.threads-form.thread-host")}</span>
            <div className="font-semibold flex items-center gap-2">
              {community && <UserAvatar username={communityTag ?? ""} size="small" />}
              {community?.title ?? "My blog"}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {i18next.t("publish.tags-hint")}
            </div>
            <TagSelector
              tags={tags ?? []}
              maxItem={10}
              onChange={(tags) => setTags(tags)}
              onValid={() => {}}
            />
            {!tags?.length && (
              <div className="text-sm text-red">{i18next.t("publish.tags-min-message")}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              disabled={!tags?.length || isPublishPending || isSchedulePending}
              onClick={submit}
              isLoading={isPublishPending || isSchedulePending}
            >
              {!isPublishPending && !isSchedulePending
                ? schedule
                  ? i18next.t("publish.schedule-now")
                  : i18next.t("publish.publish-now")
                : ""}
              {isPublishPending && i18next.t("submit.publishing")}
              {isSchedulePending && i18next.t("submit.scheduling")}
            </Button>
            <Button size="sm" appearance="gray-link" onClick={() => setShowSchedule(true)}>
              {schedule
                ? i18next.t("publish.update-schedule")
                : i18next.t("publish.schedule-later")}
            </Button>
          </div>
        </div>
      </div>

      <PublishScheduleDialog show={showSchedule} setShow={setShowSchedule} />
    </motion.div>
  );
}
