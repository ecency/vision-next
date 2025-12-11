import { useMutation } from "@tanstack/react-query";
import * as bridgeApi from "../../../api/bridge";
import { addSchedule } from "@/api/private-api";
import { useThreeSpeakManager } from "../_hooks";
import { useContext } from "react";
import { PollsContext } from "@/app/submit/_hooks/polls-manager";
import { EntryMetadataManagement } from "@/features/entry-management";
import { usePollsCreationManagement } from "@/features/polls";
import { createPermlink, isCommunity, makeCommentOptions } from "@/utils";
import { error } from "@/features/shared";
import { AxiosError } from "axios";
import i18next from "i18next";
import { postBodySummary } from "@ecency/render-helper";
import { EcencyAnalytics } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useScheduleApi(onClear: () => void) {
  const { activeUser } = useActiveAccount();
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

      // permlink duplication check
      let c;
      try {
        c = await bridgeApi.getPostHeader(author, permlink);
      } catch (e) {}

      if (c && c.author) {
        // create permlink with random suffix
        permlink = createPermlink(title, true);
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
          author,
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
