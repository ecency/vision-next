"use client";

import { useState, useRef } from "react";
import { useDebounce } from "react-use";
import isEqual from "react-fast-compare";
import { useSaveDraftApi } from "../_api";
import { usePublishState } from "./use-publish-state";

export function useAutoSavePublishDraft(step: string, draftId?: string) {
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const prevSnapshotRef = useRef<any>(null);

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
        publishingVideo
    } = usePublishState();

    const { mutateAsync: saveToDraft } = useSaveDraftApi(draftId);

    useDebounce(
        () => {
            if (step !== "edit") return;
            if (!title?.trim() && !content?.trim()) return;

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
                publishingVideo
            };

            if (isEqual(prevSnapshotRef.current, snapshot)) return;
            prevSnapshotRef.current = snapshot;

            saveToDraft()
                .then(() => {
                    setLastSaved(new Date());
                })
                .catch((err) => {
                    console.warn("Auto-save error:", err);
                });
        },
        2000,
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
            publishingVideo
        ]
    );

    return lastSaved;
}
