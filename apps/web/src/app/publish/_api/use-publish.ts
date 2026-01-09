import { validatePostCreating } from "@ecency/sdk";
import { comment, reblog } from "@/api/operations";
import { updateSpeakVideoInfo } from "@/api/threespeak";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { QueryIdentifiers, getQueryClient } from "@/core/react-query";
import { getAccountFullQueryOptions, getPostHeaderQueryOptions } from "@ecency/sdk";
import { FullAccount, RewardType } from "@/entities";
import { EntryBodyManagement, EntryMetadataManagement } from "@/features/entry-management";
import { PollSnapshot } from "@/features/polls";
import { GetPollDetailsQueryResponse } from "@/features/polls/api";
import { success } from "@/features/shared";
import {
  createPermlink,
  ensureValidPermlink,
  isCommunity,
  makeCommentOptions,
  tempEntry
} from "@/utils";
import { postBodySummary } from "@ecency/render-helper";
import { EcencyAnalytics } from "@ecency/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import i18next from "i18next";
import { usePublishState } from "../_hooks";
import * as Sentry from "@sentry/nextjs";
import { SUBMIT_DESCRIPTION_MAX_LENGTH } from "@/app/submit/_consts";
import { useActiveAccount } from "@/core/hooks";

export function usePublishApi() {
  const queryClient = useQueryClient();

  const { username, account, isLoading } = useActiveAccount();
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
    username ?? undefined,
    "post-created"
  );
  const { mutateAsync: recordUploadVideoActivity } = EcencyAnalytics.useRecordActivity(
    username ?? undefined,
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

      // Ensure user is logged in and account data is available
      if (!username) {
        throw new Error("[Publish] No active user");
      }

      // Wait for account data if still loading
      let authorData: FullAccount;
      if (isLoading) {
        const accountData = await getQueryClient().fetchQuery(getAccountFullQueryOptions(username));
        if (!accountData) {
          throw new Error("[Publish] Failed to load account data");
        }
        authorData = accountData;
      } else if (!account) {
        throw new Error("[Publish] Account data not available");
      } else {
        authorData = account;
      }

      const author = username;

      let permlink = createPermlink(title!);

      // permlink duplication check - ensure uniqueness with retry logic
      let attempts = 0;
      const maxAttempts = 10;
      while (attempts < maxAttempts) {
        try {
          const existingEntry = await getQueryClient().fetchQuery(getPostHeaderQueryOptions(author, permlink));

          if (existingEntry?.author) {
            // Permlink collision detected, create new permlink with random suffix
            permlink = createPermlink(title!, true);
            attempts++;
          } else {
            // No collision, permlink is unique
            break;
          }
        } catch (e) {
          // Fetch failed (likely 404), permlink is available
          break;
        }
      }

      if (attempts >= maxAttempts) {
        throw new Error("[Publish] Failed to generate unique permlink after multiple attempts");
      }

      const [parentPermlink] = tags!;
      const videoMetadata = publishingVideo
        ? {
            ...publishingVideo,
            permlink: ensureValidPermlink(
              publishingVideo.permlink,
              title || publishingVideo.title
            )
          }
        : undefined;

      const metaBuilder = await EntryMetadataManagement.EntryMetadataManager.shared
        .builder()
        .default()
        .extractFromBody(content!)
        // It should select filled description or if its empty or null/undefined then get auto summary
        .withSummary(
          metaDescription || postBodySummary(cleanBody, SUBMIT_DESCRIPTION_MAX_LENGTH)
        )
        .withTags(tags)
        .withPostLinks(postLinks)
        .withLocation(location)
        .withSelectedThumbnail(selectedThumbnail);
      const jsonMeta = metaBuilder
        .withVideo(title!, metaDescription!, videoMetadata)
        .withPoll(poll)
        .build();

      // If post has one unpublished video need to modify
      //    json metadata which matches to 3Speak
      if (videoMetadata) {
        // Permlink should be got from 3speak video metadata
        permlink = videoMetadata.permlink;
        // Update speak video with title, body and tags
        await updateSpeakVideoInfo(
          username,
          content!,
          videoMetadata._id,
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
          description:
            metaDescription || postBodySummary(cleanBody, SUBMIT_DESCRIPTION_MAX_LENGTH),
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
