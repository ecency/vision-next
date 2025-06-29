import { addSchedule } from "@/api/private-api";
import { getPostHeaderQuery } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { Entry, FullAccount, RewardType } from "@/entities";
import { EntryBodyManagement, EntryMetadataManagement } from "@/features/entry-management";
import { error } from "@/features/shared";
import { createPermlink, isCommunity, makeCommentOptions } from "@/utils";
import { postBodySummary } from "@ecency/render-helper";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import i18next from "i18next";
import { usePublishState } from "../_hooks";
import { EcencyAnalytics } from "@ecency/sdk";

export function useScheduleApi() {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const {
    title,
    content,
    tags,
    metaDescription,
    selectedThumbnail,
    reward,
    beneficiaries,
    isReblogToCommunity,
    schedule,
    poll,
    postLinks,
    location
  } = usePublishState();

  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    activeUser?.username,
    "post-scheduled"
  );

  return useMutation({
    mutationKey: ["schedule-2.0"],
    mutationFn: async () => {
      // const unpublished3SpeakVideo = Object.values(videos).find(
      //   (v) => v.status === "publish_manual"
      // );
      let cleanBody = EntryBodyManagement.EntryBodyManager.shared
        .builder()
        .buildClearBody(content!);

      cleanBody = EntryBodyManagement.EntryBodyManager.shared
        .builder()
        .withLocation(cleanBody, location);

      // make sure active user fully loaded
      if (!activeUser || !activeUser.data.__loaded) {
        throw new Error("[Schedule] No active user");
      }

      const author = activeUser.username;
      const authorData = activeUser.data as FullAccount;

      let permlink = createPermlink(title!);

      // permlink duplication check
      let existingEntry: Entry | null = null;
      try {
        existingEntry = await getPostHeaderQuery(author, permlink).fetchAndGet();
      } catch (e) {}

      if (existingEntry?.author) {
        // create permlink with random suffix
        permlink = createPermlink(title!, true);
      }

      const jsonMetaBuilder = await EntryMetadataManagement.EntryMetadataManager.shared
        .builder()
        .default()
        .extractFromBody(cleanBody)
        .withTags(tags)
        // It should select filled description or if its empty or null/undefined then get auto summary
        .withSummary(metaDescription || postBodySummary(cleanBody))
        .withPoll(poll)
        .withPostLinks(postLinks)
        .withLocation(location)
        .withSelectedThumbnail(selectedThumbnail);
      const jsonMeta = jsonMetaBuilder.build();
      const options = makeCommentOptions(author, permlink, reward as RewardType, beneficiaries);

      const reblog = isCommunity(tags?.[0]) && isReblogToCommunity;

      try {
        await addSchedule(
          author,
          permlink,
          title!,
          //   buildBody(body),
          cleanBody,
          jsonMeta,
          options,
          schedule?.toISOString()!,
          isReblogToCommunity!
        );
        recordActivity();
      } catch (e) {
        if (e instanceof AxiosError) {
          if (e.response?.data?.message) {
            error(e.response?.data?.message);
          } else {
            error(i18next.t("g.server-error"));
          }
        }
      }
    }
  });
}
