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
import { useRouter } from "next/navigation";
import { usePublishState } from "../_hooks";
import { EcencyAnalytics } from "@ecency/sdk";

export function useSaveDraftApi(draftId?: string) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    title,
    content,
    tags,
    beneficiaries,
    reward,
    metaDescription,
    selectedThumbnail,
    poll,
    postLinks,
    publishingVideo,
    location
  } = usePublishState();

  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    activeUser?.username,
    "draft-created"
  );

  return useMutation({
    mutationKey: ["saveDraft-2.0", draftId],
    mutationFn: async () => {
      const tagJ = tags?.join(" ");

      const metaBuilder = await EntryMetadataManagement.EntryMetadataManager.shared
        .builder()
        .default()
        .extractFromBody(content!)
        .withTags(tags)
        // It should select filled description or if its empty or null/undefined then get auto summary
        .withSummary(metaDescription! || postBodySummary(content!))
        .withPostLinks(postLinks)
        .withLocation(location)
        .withSelectedThumbnail(selectedThumbnail);

      if (publishingVideo) {
        metaBuilder.withVideo(title!, content!, publishingVideo);
      }

      const meta = metaBuilder.build();
      const draftMeta: DraftMetadata = {
        ...meta,
        beneficiaries: beneficiaries ?? [],
        rewardType: (reward as RewardType) ?? "default",
        poll
      };

      if (draftId) {
        await updateDraft(activeUser?.username!, draftId, title!, content!, tagJ!, draftMeta);
        success(i18next.t("submit.draft-updated"));
      } else {
        const resp = await addDraft(activeUser?.username!, title!, content!, tagJ!, draftMeta);
        success(i18next.t("submit.draft-saved"));

        const { drafts } = resp;
        const draft = drafts[drafts?.length - 1];

        queryClient.setQueryData([QueryIdentifiers.DRAFTS, activeUser?.username], drafts);

        router.push(`/publish/drafts/${draft._id}`);
      }

      recordActivity();
    },
    onError: () => error(i18next.t("g.server-error"))
  });
}
