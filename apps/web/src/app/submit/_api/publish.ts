import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as bridgeApi from "../../../api/bridge";
import { markAsPublished, updateSpeakVideoInfo } from "@/api/threespeak";
import { comment, formatError, reblog } from "@/api/operations";
import { useThreeSpeakManager } from "../_hooks";
import { useContext } from "react";
import { PollsContext } from "@/app/submit/_hooks/polls-manager";
import { EntryBodyManagement, EntryMetadataManagement } from "@/features/entry-management";
import { GetPollDetailsQueryResponse } from "@/features/polls/api";
import { usePollsCreationManagement } from "@/features/polls";
import { BeneficiaryRoute, Entry, FullAccount, RewardType } from "@/entities";
import { createPermlink, isCommunity, makeApp, makeCommentOptions, tempEntry } from "@/utils";
import appPackage from "../../../../package.json";
import i18next from "i18next";
import { error, success } from "@/features/shared";
import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import { QueryIdentifiers } from "@/core/react-query";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { postBodySummary } from "@ecency/render-helper";
import { validatePostCreating } from "@/api/hive";
import { EcencyAnalytics } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks";
import { getQueryClient } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";

export function usePublishApi(onClear: () => void) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { username, account, isLoading } = useActiveAccount();
  const { activePoll, clearActivePoll } = useContext(PollsContext);
  const { videos, isNsfw, buildBody } = useThreeSpeakManager();

  const { clearAll } = usePollsCreationManagement();
  const { updateEntryQueryData } = EcencyEntriesCacheManagement.useUpdateEntry();
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    username,
    "legacy-post-created"
  );

  return useMutation({
    mutationKey: ["publish"],
    mutationFn: async ({
      title,
      tags,
      body,
      description,
      reward,
      reblogSwitch,
      beneficiaries,
      selectedThumbnail
    }: {
      title: string;
      tags: string[];
      body: string;
      description: string | null;
      reward: RewardType;
      reblogSwitch: boolean;
      beneficiaries: BeneficiaryRoute[];
      selectedThumbnail?: string;
    }) => {
      const unpublished3SpeakVideo = Object.values(videos).find(
        (v) => v.status === "publish_manual"
      );
      const cbody = EntryBodyManagement.EntryBodyManager.shared.builder().buildClearBody(body);

      // Ensure user is logged in and account data is available
      if (!username) {
        return [];
      }

      // Wait for account data if still loading
      let authorData: FullAccount;
      if (isLoading) {
        const accountData = await getQueryClient().fetchQuery(getAccountFullQueryOptions(username));
        if (!accountData) {
          return [];
        }
        authorData = accountData;
      } else if (!account) {
        return [];
      } else {
        authorData = account;
      }

      const author = username;

      let permlink = createPermlink(title);

      // permlink duplication check
      let c;
      try {
        c = await bridgeApi.getPostHeader(author, permlink);
      } catch (e) {}

      if (c && c.author) {
        // create permlink with random suffix
        permlink = createPermlink(title, true);
      }

      const [parentPermlink] = tags;
      const metaBuilder = await EntryMetadataManagement.EntryMetadataManager.shared
        .builder()
        .default()
        .extractFromBody(body)
        // It should select filled description or if its empty or null/undefined then get auto summary
        .withSummary(description || postBodySummary(body))
        .withTags(tags)
        .withSelectedThumbnail(selectedThumbnail);
      const jsonMeta = metaBuilder
        .withVideo(title, description, unpublished3SpeakVideo)
        .withPoll(activePoll)
        .build();

      // If post have one unpublished video need to modify
      //    json metadata which matches to 3Speak
      if (unpublished3SpeakVideo) {
        // Permlink should be got from 3speak video metadata
        permlink = unpublished3SpeakVideo.permlink;
        // update speak video with title, body and tags
        await updateSpeakVideoInfo(
          username,
          buildBody(body),
          unpublished3SpeakVideo._id,
          title,
          tags,
          isNsfw
        );
        // set specific metadata for 3speak
        jsonMeta.app = makeApp(appPackage.version);
        jsonMeta.type = "video";
      }

      if (jsonMeta.type === "video" && activePoll) {
        throw new Error(i18next.t("polls.videos-collision-error"));
      }

      const options = makeCommentOptions(author, permlink, reward, beneficiaries);

      try {
        await comment(
          author,
          "",
          parentPermlink,
          permlink,
          title,
          buildBody(cbody),
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
            title,
            body: buildBody(body),

            tags,
            description,
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
        recordActivity().catch(() => {});

        success(i18next.t("submit.published"));
        onClear();
        clearActivePoll();
        router.push(`/@${username}/posts`);

        //Mark speak video as published
        if (!!unpublished3SpeakVideo && username === unpublished3SpeakVideo.owner) {
          success(i18next.t("video-upload.publishing"));
          setTimeout(() => {
            markAsPublished(username!, unpublished3SpeakVideo._id);
          }, 10000);
        }
        if (isCommunity(tags[0]) && reblogSwitch) {
          await reblog(author, author, permlink);
        }

        return [entry as Entry, activePoll] as const;
      } catch (e) {
        error(...formatError(e));
        throw e;
      }
    },
    onSuccess([entry, poll]) {
      clearAll();

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
