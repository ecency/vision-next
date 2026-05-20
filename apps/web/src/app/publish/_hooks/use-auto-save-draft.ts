"use client";

import { useState, useRef } from "react";
import { useDebounce } from "react-use";
import isEqual from "react-fast-compare";
import { useSaveDraftApi } from "../_api";
import { usePublishState } from "./use-publish-state";
import { useDraftTabCoordinator } from "./use-draft-tab-coordinator";
import {
  AUTOSAVE_DEBOUNCE_MS,
  AUTOSAVE_MIN_INTERVAL_MS,
  AUTOSAVE_FAIL_THRESHOLD,
  AUTOSAVE_COOLDOWN_MS
} from "./autosave-policy";

export function useAutoSavePublishDraft(step: string, draftId?: string) {
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const prevSnapshotRef = useRef<unknown>(null);
    const lastAttemptAtRef = useRef<number>(0);
    const consecutiveFailsRef = useRef<number>(0);
    const cooldownUntilRef = useRef<number>(0);

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
        location
    } = usePublishState();

    const { mutateAsync: saveToDraft } = useSaveDraftApi(draftId);
    const { isActiveTab } = useDraftTabCoordinator(draftId);

    useDebounce(
        () => {
            if (step !== "edit") return;
            if (!title?.trim() && !content?.trim()) return;

            // Only auto-save if this is the active tab
            if (!isActiveTab) return;

            const now = Date.now();
            if (now < cooldownUntilRef.current) return;
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
                location
            };

            if (isEqual(prevSnapshotRef.current, snapshot)) return;
            lastAttemptAtRef.current = now;

            saveToDraft({ showToast: false, redirect: false })
                .then(() => {
                    setLastSaved(new Date());
                    prevSnapshotRef.current = snapshot;
                    consecutiveFailsRef.current = 0;
                })
                .catch((err) => {
                    consecutiveFailsRef.current += 1;
                    if (consecutiveFailsRef.current >= AUTOSAVE_FAIL_THRESHOLD) {
                        cooldownUntilRef.current = Date.now() + AUTOSAVE_COOLDOWN_MS;
                    }
                    console.warn("Auto-save error:", err);
                });
        },
        AUTOSAVE_DEBOUNCE_MS,
        [
            step,
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
            isActiveTab
        ]
    );

    return { lastSaved, isActiveTab };
}
