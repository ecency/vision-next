"use client";

import { TagSelector } from "@/app/submit/_components";
import { Alert, Button, FormControl } from "@/features/ui";
import { formatError } from "@/api/operations";
import { handleAndReportError, error as feedbackError } from "@/features/shared";
import { UilMultiply } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMount } from "react-use";
import { usePublishApi, useScheduleApi } from "../_api";
import { usePublishState } from "../_hooks";
import { PublishActionBarCommunity } from "./publish-action-bar-community";
import { PublishScheduleDialog } from "./publish-schedule-dialog";
import { PublishValidatePostMeta } from "./publish-validate-post-meta";
import { PublishValidatePostThumbnailPicker } from "./publish-validate-post-thumbnail-picker";
import { isCommunity } from "@/utils";
import { hasPublishContent } from "../_utils/content";

interface Props {
  onClose: () => void;
  onSuccess: (step: "published" | "scheduled") => void;
}

export function PublishValidatePost({ onClose, onSuccess }: Props) {
  const {
    tags,
    setTags,
    schedule,
    clearAll,
    content,
    metaDescription,
    setMetaDescription,
    isReblogToCommunity,
    setIsReblogToCommunity,
    beneficiaries,
    title
  } = usePublishState();

  const [showSchedule, setShowSchedule] = useState(false);

  const beneficiaryReward = useMemo(
    () =>
      isCommunity(tags?.[0])
        ? beneficiaries?.find((ben) => ben.account === tags?.[0])?.weight
        : undefined,
    [beneficiaries, tags]
  );

  const { mutateAsync: publishNow, isPending: isPublishPending } = usePublishApi();
  const { mutateAsync: scheduleNow, isPending: isSchedulePending } = useScheduleApi();

  const submit = useCallback(async () => {
    if (!title?.trim()) {
      feedbackError(i18next.t("submit.empty-title-alert"));
      return;
    }

    if (!hasPublishContent(content)) {
      feedbackError(i18next.t("submit.empty-body-alert"));
      return;
    }

    try {
      if (schedule) {
        await scheduleNow(schedule!);

        onSuccess("scheduled");
      } else {
        await publishNow();

        onSuccess("published");
      }

      clearAll();
    } catch (err) {
      const [message] = formatError(err);
      const handled = handleAndReportError(err, "publish-post");
      if (handled) {
        feedbackError(message || i18next.t("g.server-error"));
      } else {
        throw err;
      }
    }
  }, [
    clearAll,
    content,
    onSuccess,
    publishNow,
    schedule,
    scheduleNow,
    title
  ]);

  useMount(() => {
    const computedTags = Array.from(
      content ? content.matchAll(/#([\p{L}\p{N}\p{M}_-]+)/gu) : []
    ).map(([, tag]) => tag.toLowerCase());
    const normalizedExistingTags = (tags ?? []).map((tag) => tag.toLowerCase());
    const uniqueTagsSet = new Set([...normalizedExistingTags, ...computedTags]);
    setTags(Array.from(uniqueTagsSet).slice(0, 10));
  });

  useEffect(() => {
    if (!content) return;

    // Only generate description if it's empty or 1-char garbage
    if (!metaDescription || metaDescription.trim().length <= 1) {
      const plainText = content
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const description = plainText.slice(0, 160);
      setMetaDescription(description);
    }
  }, [content]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="publish-page max-w-[1024px] mx-auto pb-20 sm:pb-0"
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
        <div className="flex flex-col gap-4 md:gap-6 lg:gap-7 items-start">
          <PublishActionBarCommunity />

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

          {isCommunity(tags?.[0]) && (
            <div className="text-sm">
              <FormControl
                type="checkbox"
                isToggle={true}
                id="reblog-switch"
                label={i18next.t("submit.reblog")}
                checked={isReblogToCommunity ?? false}
                onChange={(v) => {
                  setIsReblogToCommunity(v);
                }}
              />
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {i18next.t("submit.reblog-hint")}
              </div>
            </div>
          )}

          {(beneficiaryReward ?? 0) / 100 > 25 && (
            <Alert className="w-full" appearance="warning">
              {i18next.t("publish.community-beneficiary.hint")}
            </Alert>
          )}

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
