import { addDraft, updateDraft } from "@/api/private-api";
import { useGlobalStore } from "@/core/global-store";
import { QueryIdentifiers } from "@/core/react-query";
import { DraftMetadata, RewardType } from "@/entities";
import { EntryMetadataManagement } from "@/features/entry-management";
import { success } from "@/features/shared";
import { postBodySummary } from "@ecency/render-helper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { error } from "highcharts";
import i18next from "i18next";
import { useParams, useRouter } from "next/navigation";
import { usePublishState } from "../_hooks";

export function useSaveDraftApi() {
  const activeUser = useGlobalStore((s) => s.activeUser);
  //   const { videos } = useThreeSpeakManager();
  //   const { activePoll, clearActivePoll } = useContext(PollsContext);

  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  const { title, content, tags, beneficiaries, reward, metaDescription, selectedThumbnail, poll } =
    usePublishState();

  return useMutation({
    mutationKey: ["saveDraft-2.0"],
    mutationFn: async ({} //   videoMetadata
    : {
      //   videoMetadata?: ThreeSpeakVideo;
    }) => {
      const tagJ = tags?.join(" ");

      const metaBuilder = await EntryMetadataManagement.EntryMetadataManager.shared
        .builder()
        .default()
        .extractFromBody(content!)
        .withTags(tags)
        // It should select filled description or if its empty or null/undefined then get auto summary
        .withSummary(metaDescription! || postBodySummary(content!))
        .withSelectedThumbnail(selectedThumbnail);

      const meta = metaBuilder.build();
      const draftMeta: DraftMetadata = {
        ...meta,
        beneficiaries: beneficiaries!,
        rewardType: reward as RewardType,
        // videos,
        poll
      };

      if (params.id) {
        await updateDraft(
          activeUser?.username!,
          params.id as string,
          title!,
          content!,
          tagJ!,
          draftMeta
        );
        success(i18next.t("submit.draft-updated"));
      } else {
        const resp = await addDraft(activeUser?.username!, title!, content!, tagJ!, draftMeta);
        success(i18next.t("submit.draft-saved"));

        const { drafts } = resp;
        const draft = drafts[drafts?.length - 1];

        queryClient.setQueryData([QueryIdentifiers.DRAFTS, activeUser?.username], drafts);

        router.push(`publish/drafts/${draft._id}`);
      }
    },
    onError: () => error(i18next.t("g.server-error"))
  });
}
