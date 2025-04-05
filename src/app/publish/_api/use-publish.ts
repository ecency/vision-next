import { EcencyEntriesCacheManagement } from "@/core/caches";
import { useGlobalStore } from "@/core/global-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePublishState } from "../_hooks";
import { EntryBodyManagement, EntryMetadataManagement } from "@/features/entry-management";
import { Entry, FullAccount, RewardType } from "@/entities";
import { createPermlink, isCommunity, makeCommentOptions, tempEntry } from "@/utils";
import { getPostHeaderQuery } from "@/api/queries";
import { postBodySummary } from "@ecency/render-helper";
import { comment, formatError, reblog } from "@/api/operations";
import { validatePostCreating } from "@/api/hive";
import { error, success } from "@/features/shared";
import i18next from "i18next";
import { GetPollDetailsQueryResponse } from "@/features/polls/api";
import { QueryIdentifiers } from "@/core/react-query";
import { PollSnapshot } from "@/features/polls";
import { useRouter } from "next/navigation";

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
    poll
  } = usePublishState();

  const { updateEntryQueryData } = EcencyEntriesCacheManagement.useUpdateEntry();

  return useMutation({
    mutationKey: ["publish-2.0"],
    mutationFn: async () => {
      // const unpublished3SpeakVideo = Object.values(videos).find(
      //   (v) => v.status === "publish_manual"
      // );
      const cleanBody = EntryBodyManagement.EntryBodyManager.shared
        .builder()
        .buildClearBody(content!);

      // make sure active user fully loaded
      if (!activeUser || !activeUser.data.__loaded) {
        throw new Error("[Publish] No active user");
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

      const [parentPermlink] = tags!;
      const metaBuilder = await EntryMetadataManagement.EntryMetadataManager.shared
        .builder()
        .default()
        .extractFromBody(content!)
        // It should select filled description or if its empty or null/undefined then get auto summary
        .withSummary(metaDescription || postBodySummary(cleanBody))
        .withTags(tags)
        .withSelectedThumbnail(selectedThumbnail);
      const jsonMeta = metaBuilder
        // .withVideo(title, description, unpublished3SpeakVideo)
        .withPoll(poll)
        .build();

      // If post have one unpublished video need to modify
      //    json metadata which matches to 3Speak
      //   if (unpublished3SpeakVideo) {
      //     // Permlink should be got from 3speak video metadata
      //     permlink = unpublished3SpeakVideo.permlink;
      //     // update speak video with title, body and tags
      //     await updateSpeakVideoInfo(
      //       activeUser.username,
      //       buildBody(body),
      //       unpublished3SpeakVideo._id,
      //       title,
      //       tags,
      //       isNsfw
      //     );
      //     // set specific metadata for 3speak
      //     jsonMeta.app = makeApp(appPackage.version);
      //     jsonMeta.type = "video";
      //   }

      //   if (jsonMeta.type === "video" && activePoll) {
      //     throw new Error(i18next.t("polls.videos-collision-error"));
      //   }

      const options = makeCommentOptions(author, permlink, reward as RewardType, beneficiaries);

      try {
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

        // Create entry object in store and cache
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
          max_accepted_payout: options.max_accepted_payout,
          percent_hbd: options.percent_hbd
        };
        updateEntryQueryData([entry]);

        await validatePostCreating(entry.author, entry.permlink, 3);

        success(i18next.t("submit.published"));

        //Mark speak video as published
        // if (!!unpublished3SpeakVideo && activeUser.username === unpublished3SpeakVideo.owner) {
        //   success(i18next.t("video-upload.publishing"));
        //   setTimeout(() => {
        //     markAsPublished(activeUser!.username, unpublished3SpeakVideo._id);
        //   }, 10000);
        // }
        if (isCommunity(tags?.[0]) && isReblogToCommunity) {
          await reblog(author, author, permlink);
        }

        // return [entry as Entry, activePoll] as const;
        return [entry, null as PollSnapshot | null] as const;
      } catch (e) {
        error(...formatError(e));
        throw e;
      }
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
            poll_choices: poll?.choices.map((c, i) => ({
              choice_num: i,
              choice_text: c,
              votes: null
            })),
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
