"use client";

import { useCallback, useMemo } from "react";
import { useSynchronizedLocalStorage } from "@/utils/use-synchronized-local-storage";
import { PREFIX } from "@/utils/local-storage";

const STORAGE_KEY = PREFIX + "_waves_custom_tags";
// Keep the scrollable tab bar sane; mirrors a reasonable on-device cap.
const MAX_TAGS = 20;

/**
 * Normalize a user-typed tag to a valid Hive tag: lowercase, leading '#' stripped,
 * and anything other than alphanumerics/hyphens removed (so "#My Tag!" becomes
 * "mytag"). Mirrors the mobile app's wave tag normalization.
 */
export function normalizeWaveTag(raw: string): string {
  return (raw || "")
    .trim()
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Persisted (browser-local) list of custom waves "feeds" — each is a tag the user
 * pinned as its own feed tab, mirroring the mobile waves custom tabs. Synced live
 * across hook instances (e.g. tab bar + picker) via the storage event bus.
 */
export function useWavesCustomFeeds() {
  const [stored, setStored] = useSynchronizedLocalStorage<string[]>(STORAGE_KEY, []);

  const tags = useMemo(() => (Array.isArray(stored) ? stored : []), [stored]);

  const addTag = useCallback(
    (raw: string) => {
      const tag = normalizeWaveTag(raw);
      // The storage setter broadcasts the value verbatim, so pass a concrete
      // array (not a functional updater) computed from the current snapshot.
      if (!tag || tags.includes(tag)) {
        return;
      }
      setStored([...tags, tag].slice(0, MAX_TAGS));
    },
    [tags, setStored]
  );

  const removeTag = useCallback(
    (tag: string) => {
      setStored(tags.filter((t) => t !== tag));
    },
    [tags, setStored]
  );

  return { tags, addTag, removeTag };
}
