import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addSchedule, getPostHeaderQueryOptions } from "@ecency/sdk";
import { useThreeSpeakManager } from "../_hooks";
import { useContext } from "react";
import { PollsContext } from "@/app/submit/_hooks/polls-manager";
import { EntryMetadataManagement } from "@/features/entry-management";
import { usePollsCreationManagement } from "@/features/polls";
import { createPermlink, getAccessToken, isCommunity, makeCommentOptions } from "@/utils";
import { error } from "@/features/shared";
import { AxiosError } from "axios";
import i18next from "i18next";
import { postBodySummary } from "@ecency/render-helper";
import { EcencyAnalytics } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useScheduleApi(onClear: () => void) {
  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();
  const { buildBody } = useThreeSpeakManager();
  const { activePoll, clearActivePoll } = useContext(PollsContext);

  const { clearAll } = usePollsCreationManagement();
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    activeUser?.username,
    "legacy-post-scheduled"
  );

  return useMutation({
    mutationKey: ["schedule"],
    mutationFn: async ({
      title,
      tags,
      body,
      reward,
      reblogSwitch,
      beneficiaries,
      schedule,
      description,
      selectedThumbnail
    }: Record<string, any>) => {
      // make sure active user and schedule date has set
      if (!activeUser || !schedule) {
        return;
      }

      let author = activeUser.username;
      let permlink = createPermlink(title);

      // permlink duplication check - ensure uniqueness with retry logic
      let attempts = 0;
      const maxAttempts = 10;
      while (attempts < maxAttempts) {
        try {
          const existingEntry = await queryClient.fetchQuery(
            getPostHeaderQueryOptions(author, permlink)
          );

          if (existingEntry && existingEntry.author) {
            // Permlink collision detected, create new permlink with random suffix
            permlink = createPermlink(title, true);
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
        throw new Error("[Schedule] Failed to generate unique permlink after multiple attempts");
      }

      const jsonMetaBuilder = await EntryMetadataManagement.EntryMetadataManager.shared
        .builder()
        .default()
        .extractFromBody(body)
        .withTags(tags)
        // It should select filled description or if its empty or null/undefined then get auto summary
        .withSummary(description || postBodySummary(body))
        .withPoll(activePoll)
        .withSelectedThumbnail(selectedThumbnail);
      const jsonMeta = jsonMetaBuilder.build();
      let options = makeCommentOptions(author, permlink, reward, beneficiaries);
      if (!options) {
        options = {
          allow_curation_rewards: true,
          allow_votes: true,
          author,
          permlink,
          max_accepted_payout: "1000000.000 HBD",
          percent_hbd: 10000,
          extensions: []
        };
      }

      const reblog = isCommunity(tags[0]) && reblogSwitch;

      try {
        await addSchedule(
          getAccessToken(author),
          permlink,
          title,
          buildBody(body),
          jsonMeta,
          options,
          schedule,
          reblog
        );
        onClear();
        clearActivePoll();
      } catch (e) {
        if (e instanceof AxiosError) {
          if (e.response?.data?.message) {
            error(e.response?.data?.message);
          } else {
            error(i18next.t("g.server-error"));
          }
        }
        // Propagate error so the mutation is rejected
        throw e;
      }
    },
    onSuccess: () => {
      recordActivity();
      clearAll();
    }
  });
}
