import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useThreeSpeakManager } from "../_hooks";
import { useContext } from "react";
import { PollsContext } from "@/app/submit/_hooks/polls-manager";
import { BeneficiaryRoute, Draft, DraftMetadata, RewardType } from "@/entities";
import { ThreeSpeakVideo } from "@/api/threespeak";
import { EntryMetadataManagement } from "@/features/entry-management";
import { addDraft, updateDraft } from "@ecency/sdk";
import i18next from "i18next";
import { success, error } from "@/features/shared";
import { QueryIdentifiers } from "@/core/react-query";
import { useRouter } from "next/navigation";
import { postBodySummary } from "@ecency/render-helper";
import { EcencyAnalytics } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccessToken } from "@/utils";

export function useSaveDraftApi(onDraftCreated?: (draft: Draft) => void) {
  const { username } = useActiveAccount();
  const { videos } = useThreeSpeakManager();
  const { activePoll, clearActivePoll } = useContext(PollsContext);

  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    username,
    "legacy-draft-created"
  );

  return useMutation({
    mutationKey: ["saveDraft"],
    mutationFn: async ({
      title,
      body,
      tags,
      editingDraft,
      beneficiaries,
      reward,
      description,
      selectedThumbnail,
      videoMetadata
    }: {
      title: string;
      body: string;
      tags: string[];
      editingDraft: Draft | null;
      beneficiaries: BeneficiaryRoute[];
      reward: RewardType;
      description: string | null;
      selectedThumbnail?: string;
      videoMetadata?: ThreeSpeakVideo;
    }) => {
      const tagJ = tags.join(" ");

      const metaBuilder = await EntryMetadataManagement.EntryMetadataManager.shared
        .builder()
        .default()
        .extractFromBody(body)
        .withTags(tags)
        // It should select filled description or if its empty or null/undefined then get auto summary
        .withSummary(description || postBodySummary(body))
        .withSelectedThumbnail(selectedThumbnail);

      const meta = metaBuilder.build();
      const draftMeta: DraftMetadata = {
        ...meta,
        beneficiaries: beneficiaries ?? [],
        rewardType: reward ?? "default",
        videos,
        poll: activePoll
      };

      try {
        if (!username) {
          return;
        }

        if (editingDraft) {
          await updateDraft(
            getAccessToken(username),
            editingDraft._id,
            title,
            body,
            tagJ,
            draftMeta
          );
          success(i18next.t("submit.draft-updated"));

          // Construct the updated draft with fresh data
          const updatedDraft: Draft = {
            ...editingDraft,
            title,
            body,
            tags: tagJ,
            tags_arr: tags,
            meta: draftMeta,
            modified: new Date().toISOString()
          };

          // Update the draft in the infinite query cache
          queryClient.setQueryData(
            ["posts", "drafts", "infinite", username, 10],
            (oldData: any) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                  ...page,
                  data: page.data.map((d: Draft) =>
                    d._id === editingDraft._id ? updatedDraft : d
                  )
                }))
              };
            }
          );

          // Also update the regular query cache
          queryClient.setQueryData(
            [QueryIdentifiers.DRAFTS, username],
            (oldDrafts: Draft[] | undefined) => {
              if (!oldDrafts) return oldDrafts;
              return oldDrafts.map((d) => (d._id === editingDraft._id ? updatedDraft : d));
            }
          );

          clearActivePoll();
          return { draft: updatedDraft, isNew: false };
        } else {
          const resp = await addDraft(getAccessToken(username), title, body, tagJ, draftMeta);
          success(i18next.t("submit.draft-saved"));

          recordActivity();

          const { drafts } = resp;
          const draft = drafts[drafts?.length - 1];

          // Update both regular and infinite query caches
          queryClient.setQueryData([QueryIdentifiers.DRAFTS, username], drafts);

          // Update infinite query cache to include the new draft in the first page
          queryClient.setQueryData(
            ["posts", "drafts", "infinite", username, 10],
            (oldData: any) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                pages: oldData.pages.map((page: any, index: number) =>
                  index === 0
                    ? { ...page, data: [draft, ...page.data] }
                    : page
                )
              };
            }
          );

          // Update URL without navigation to reflect that we're now editing a draft
          router.replace(`/draft/${draft._id}`, { scroll: false });

          // Notify parent component about the new draft
          if (onDraftCreated) {
            onDraftCreated(draft);
          }

          clearActivePoll();
          return { draft, isNew: true };
        }
      } catch (e) {
        error(i18next.t("g.server-error"));
      }
    }
  });
}
