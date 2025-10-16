import { useState } from "react";
import { useDebounce } from "react-use";
import { useSaveDraftApi } from "../_api";
import { usePublishState } from "./use-publish-state";

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

  useDebounce(
    async () => {
      if (!title?.trim() && !content?.trim()) {
        return;
      }

      const id = await saveToDraft({ showToast: false });
      // Only create returns an ID
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
      location
    ]
  );

  return lastSaved;
}
