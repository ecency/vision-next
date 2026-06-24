import { useRef, useState } from "react";
import isEqual from "react-fast-compare";
import { useDebounce } from "react-use";
import { useSaveDraftApi } from "../_api";
import { usePublishState } from "./use-publish-state";
import { useDraftTabCoordinator } from "./use-draft-tab-coordinator";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import {
  AUTOSAVE_DEBOUNCE_MS,
  AUTOSAVE_MIN_INTERVAL_MS,
  AUTOSAVE_FAIL_THRESHOLD,
  AUTOSAVE_COOLDOWN_MS
} from "./autosave-policy";

/**
 * This hook auto-save publish page content to draft whenever post changes
 * It creates new draft each time when publish page opens
 */
export function usePublishAutosave() {
  const [draftId, setDraftId] = useState<string>();
  const [lastSaved, setLastSaved] = useState<Date>();
  const { activeUser } = useActiveAccount();

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
    location,
    decentMemes
  } = usePublishState();

  const { mutateAsync: saveToDraft } = useSaveDraftApi(draftId);
  const { isActiveTab } = useDraftTabCoordinator(draftId);

  const prevSnapshotRef = useRef<unknown>(null);
  const lastAttemptAtRef = useRef<number>(0);
  const consecutiveFailsRef = useRef<number>(0);
  const cooldownUntilRef = useRef<number>(0);

  useDebounce(
    async () => {
      if (!activeUser?.username) return;
      if (!title?.trim() && !content?.trim()) return;
      // Only auto-save if this is the active tab
      if (!isActiveTab) return;

      const now = Date.now();
      // Circuit breaker: too many consecutive failures backs us off so a
      // broken server (e.g. /private-api/drafts-add returning 406) can't be
      // hammered every debounce window.
      if (now < cooldownUntilRef.current) return;
      // Hard floor between attempts so prolific typing can't fan out into
      // many saves per minute.
      if (now - lastAttemptAtRef.current < AUTOSAVE_MIN_INTERVAL_MS) return;

      const snapshot = {
        title,
        content,
        tags,
        beneficiaries,
        reward,
        metaDescription,
        selectedThumbnail,
        poll,
        postLinks,
        location,
        decentMemes
      };
      if (isEqual(prevSnapshotRef.current, snapshot)) return;

      lastAttemptAtRef.current = now;

      try {
        const id = await saveToDraft({ showToast: false, redirect: false });
        // Only create returns an ID (first save creates draft)
        if (id) setDraftId(id);
        setLastSaved(new Date());
        prevSnapshotRef.current = snapshot;
        consecutiveFailsRef.current = 0;
      } catch {
        consecutiveFailsRef.current += 1;
        if (consecutiveFailsRef.current >= AUTOSAVE_FAIL_THRESHOLD) {
          cooldownUntilRef.current = Date.now() + AUTOSAVE_COOLDOWN_MS;
        }
      }
    },
    AUTOSAVE_DEBOUNCE_MS,
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
      location,
      decentMemes,
      isActiveTab
    ]
  );

  return { lastSaved, isActiveTab, draftId };
}
