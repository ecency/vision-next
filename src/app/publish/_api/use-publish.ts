import { validatePostCreating } from "@/api/hive";
import { comment, reblog } from "@/api/operations";
import { getPostHeaderQuery } from "@/api/queries";
import { updateSpeakVideoInfo } from "@/api/threespeak";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useGlobalStore } from "@/core/global-store";
import { QueryIdentifiers } from "@/core/react-query";
import { FullAccount, RewardType } from "@/entities";
import { EntryBodyManagement, EntryMetadataManagement } from "@/features/entry-management";
import { PollSnapshot } from "@/features/polls";
import { GetPollDetailsQueryResponse } from "@/features/polls/api";
import { success } from "@/features/shared";
import { createPermlink, isCommunity, makeCommentOptions, tempEntry } from "@/utils";
import { postBodySummary } from "@ecency/render-helper";
import { EcencyAnalytics } from "@ecency/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import i18next from "i18next";
import { usePublishState } from "../_hooks";
import * as Sentry from "@sentry/nextjs";

export function usePublishApi() {
  const queryClient = useQueryClient();

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
    poll,
    publishingVideo,
    postLinks,
    location
  } = usePublishState();

  const { updateEntryQueryData } = EcencyEntriesCacheManagement.useUpdateEntry();
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    activeUser?.username,
    "post-created"
  );
  const { mutateAsync: recordUploadVideoActivity } = EcencyAnalytics.useRecordActivity(
    activeUser?.username,
    "video-published"
  );

  return useMutation({
    mutationKey: ["publish-2.0"],
    mutationFn: async () => {
      let cleanBody = EntryBodyManagement.EntryBodyManager.shared
        .builder()
        .buildClearBody(content!);

      cleanBody = EntryBodyManagement.EntryBodyManager.shared
        .builder()
        .withLocation(cleanBody, location);

      // make sure active user fully loaded
      if (!activeUser || !activeUser.data.__loaded) {
        throw new Error("[Publish] No active user");
      }

      const author = activeUser.username;
      const authorData = activeUser.data as FullAccount;

      let permlink = createPermlink(title!);

      // permlink duplication check
      try {
        const existingEntry = await getPostHeaderQuery(author, permlink).fetchAndGet();

        if (existingEntry?.author) {
          // create permlink with random suffix
          permlink = createPermlink(title!, true);
        }
      } catch (e) {}

      const [parentPermlink] = tags!;
      const metaBuilder = await EntryMetadataManagement.EntryMetadataManager.shared
        .builder()
        .default()
        .extractFromBody(content!)
        // It should select filled description or if its empty or null/undefined then get auto summary
        .withSummary(metaDescription || postBodySummary(cleanBody))
        .withTags(tags)
        .withPostLinks(postLinks)
        .withLocation(location)
        .withSelectedThumbnail(selectedThumbnail);
      const jsonMeta = metaBuilder
        .withVideo(title!, metaDescription!, publishingVideo)
        .withPoll(poll)
        .build();

      // If post has one unpublished video need to modify
      //    json metadata which matches to 3Speak
      if (publishingVideo) {
        // Permlink should be got from 3speak video metadata
        permlink = publishingVideo.permlink;
        // Update speak video with title, body and tags
        await updateSpeakVideoInfo(
          activeUser.username,
          content!,
          publishingVideo._id,
          title!,
          tags ?? [],
          // isNsfw,
          false
        );
      }

      if (jsonMeta.type === "video" && poll) {
        throw new Error(i18next.t("polls.videos-collision-error"));
      }

      const options = makeCommentOptions(author, permlink, reward as RewardType, beneficiaries);

      await comment(
        author,
        "",
        parentPermlink,
        permlink,
        title!,
        //   buildBody(cleanBody),
        cleanBody,
        jsonMeta,
        options,
        true
      );

      // Create an entry object in store and cache
      const entry = {
        ...tempEntry({
          author: authorData!,
          permlink,
          parentAuthor: "",
          parentPermlink,
          title: title!,
          // body: buildBody(body),
          body: content!,

          tags: tags!,
          description: metaDescription || postBodySummary(cleanBody),
          jsonMeta
        }),
        max_accepted_payout: options?.max_accepted_payout ?? "1000000.000 HBD",
        percent_hbd: options?.percent_hbd ?? 10000
      };
      updateEntryQueryData([entry]);

      try {
        await validatePostCreating(entry.author, entry.permlink, 3);
      } catch (e) {
        Sentry.captureException(e, {
          extra: { username: entry.author }
        });
      }

      // Record all user activity
      recordActivity().catch(() => {});
      if (publishingVideo) {
        recordUploadVideoActivity().catch(() => {});
      }

      success(i18next.t("submit.published"));
      if (isCommunity(tags?.[0]) && isReblogToCommunity) {
        await reblog(author, author, permlink);
      }

      // return [entry as Entry, activePoll] as const;
      return [entry, null as PollSnapshot | null] as const;
    },
    onSuccess([entry, poll]) {
      queryClient.setQueryData<GetPollDetailsQueryResponse | undefined>(
        [QueryIdentifiers.POLL_DETAILS, entry?.author, entry?.permlink],
        (data) => {
          if (!data) {
            return data;
          }

          return {
            author: entry.author,
            created: new Date().toISOString(),
            end_time: poll?.endTime.toISOString(),
            filter_account_age_days: poll?.filters?.accountAge,
            permlink: entry.permlink,
            poll_choices: Array.isArray(poll?.choices)
                ? poll.choices.map((c, i) => ({
                  choice_num: i,
                  choice_text: c,
                  votes: null
                }))
                : [],
            poll_stats: { total_voting_accounts_num: 0, total_hive_hp_incl_proxied: null },
            poll_trx_id: undefined,
            poll_voters: undefined,
            preferred_interpretation: poll?.interpretation,
            question: poll?.title,
            status: "active",
            tags: [],
            token: null
          } as unknown as GetPollDetailsQueryResponse;
        }
      );
    }
  });
}
