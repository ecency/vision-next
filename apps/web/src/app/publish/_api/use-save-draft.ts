import { addDraft, updateDraft } from "@/api/private-api";
import { QueryIdentifiers } from "@/core/react-query";
import { DraftMetadata, RewardType } from "@/entities";
import { EntryMetadataManagement } from "@/features/entry-management";
import { error, success, info } from "@/features/shared";
import { postBodySummary } from "@ecency/render-helper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import i18next from "i18next";
import { useRouter } from "next/navigation";
import { usePublishState } from "../_hooks";
import { useOptionalUploadTracker } from "../_hooks/use-upload-tracker";
import { EcencyAnalytics } from "@ecency/sdk";
import { formatError } from "@/api/operations";
import { SUBMIT_DESCRIPTION_MAX_LENGTH } from "@/app/submit/_consts";
import { useActiveAccount } from "@/core/hooks/use-active-account";

type SaveDraftOptions = {
  showToast?: boolean;
  redirect?: boolean;
};

export function useSaveDraftApi(draftId?: string) {
  const { activeUser } = useActiveAccount();

  const router = useRouter();
  const queryClient = useQueryClient();
  const uploadTracker = useOptionalUploadTracker();

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
    mutationFn: async ({ showToast = true, redirect = true }: SaveDraftOptions = {}) => {
      if (!activeUser?.username) {
        throw new Error("[Draft] No active user");
      }

      const username = activeUser.username;

      const tagJ = tags?.join(" ");

      const metaBuilder = await EntryMetadataManagement.EntryMetadataManager.shared
        .builder()
        .default()
        .extractFromBody(content!)
        .withTags(tags)
        // It should select filled description or if its empty or null/undefined then get auto summary
        .withSummary(metaDescription! || postBodySummary(content!, SUBMIT_DESCRIPTION_MAX_LENGTH))
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
        const resp = await updateDraft(username, draftId, title!, content!, tagJ!, draftMeta);
        if (showToast) {
          success(i18next.t("submit.draft-updated"));
        }

        queryClient.setQueryData([QueryIdentifiers.DRAFTS, username], resp.drafts);
      } else {
        const resp = await addDraft(username, title!, content!, tagJ!, draftMeta);
        if (showToast) {
          success(i18next.t("submit.draft-saved"));
        }

        const { drafts } = resp;
        const draft = drafts[drafts?.length - 1];

        queryClient.setQueryData([QueryIdentifiers.DRAFTS, username], drafts);

        if (redirect) {
          // Wait for any pending uploads before redirecting
          if (uploadTracker?.hasPendingUploads) {
            info(i18next.t("publish.waiting-for-uploads", { defaultValue: "Waiting for images to upload..." }));
            await uploadTracker.waitForUploads();
          }
          router.push(`/publish/drafts/${draft._id}`);
        }

        return drafts[drafts.length - 1]._id;
      }

      recordActivity();
    },
    onError: (err) => error(...formatError(err))
  });
}
