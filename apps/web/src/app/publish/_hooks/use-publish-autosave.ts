import { useState } from "react";
import { useDebounce } from "react-use";
import { useSaveDraftApi } from "../_api";
import { usePublishState } from "./use-publish-state";
import { useDraftTabCoordinator } from "./use-draft-tab-coordinator";

/**
 * This hook auto-save publish page content to draft whenever post changes
 * It creates new draft each time when publish page opens
 */
export function usePublishAutosave() {
  const [draftId, setDraftId] = useState<string>();
  const [lastSaved, setLastSaved] = useState<Date>();

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

  const { mutateAsync: saveToDraft } = useSaveDraftApi(draftId);
  const { isActiveTab } = useDraftTabCoordinator(draftId);

  useDebounce(
    async () => {
      if (!title?.trim() && !content?.trim()) {
        return;
      }

      // Only auto-save if this is the active tab
      if (!isActiveTab) {
        return;
      }

      const id = await saveToDraft({ showToast: false, redirect: false });
      // Only create returns an ID (first save creates draft)
      if (id) {
        setDraftId(id);
      }
      setLastSaved(new Date());
    },
    2000,
    [
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
      location,
      isActiveTab
    ]
  );

  return { lastSaved, isActiveTab, draftId };
}
