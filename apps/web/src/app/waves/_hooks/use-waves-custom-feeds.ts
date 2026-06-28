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

// Read the freshest persisted list at write time. localStorage is the source of
// truth behind the storage hook, so reading it here (instead of this instance's
// last-rendered snapshot) keeps concurrent add/remove from different hook
// instances (page + dialog) from clobbering each other with a stale value.
function readStoredTags(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persisted (browser-local) list of custom waves "feeds": each is a tag the user
 * pinned as its own feed tab, mirroring the mobile waves custom tabs. Synced live
 * across hook instances (e.g. tab bar + picker) via the storage event bus.
 */
export function useWavesCustomFeeds() {
  const [stored, setStored] = useSynchronizedLocalStorage<string[]>(STORAGE_KEY, []);

  const tags = useMemo(() => (Array.isArray(stored) ? stored : []), [stored]);

  // Returns true only when the tag was actually pinned (not a dup / not over the
  // cap), so callers can avoid selecting/clearing on a no-op add. The storage
  // setter broadcasts the value verbatim, so pass a concrete array.
  const addTag = useCallback(
    (raw: string): boolean => {
      const tag = normalizeWaveTag(raw);
      if (!tag) {
        return false;
      }
      const current = readStoredTags();
      if (current.includes(tag) || current.length >= MAX_TAGS) {
        return false;
      }
      setStored([...current, tag]);
      return true;
    },
    [setStored]
  );

  const removeTag = useCallback(
    (tag: string) => {
      setStored(readStoredTags().filter((t) => t !== tag));
    },
    [setStored]
  );

  return { tags, addTag, removeTag, isFull: tags.length >= MAX_TAGS, maxTags: MAX_TAGS };
}
