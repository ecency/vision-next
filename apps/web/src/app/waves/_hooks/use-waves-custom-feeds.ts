"use client";

import { useCallback, useMemo } from "react";
import { useSynchronizedLocalStorage } from "@/utils/use-synchronized-local-storage";
import { PREFIX } from "@/utils/local-storage";

const TAGS_KEY = PREFIX + "_waves_custom_tags";
const SOURCES_KEY = PREFIX + "_waves_custom_sources";
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
function readStored(key: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persisted (browser-local) custom waves "feeds", mirroring the mobile waves
 * custom tabs. Two kinds:
 *  - tags: a Hive tag pinned as its own feed tab.
 *  - sources: a waves container host (e.g. peak.snaps, leothreads) pinned as a
 *    feed tab so the user can follow one app/source on its own.
 * Synced live across hook instances (tab bar + picker) via the storage event bus.
 */
export function useWavesCustomFeeds() {
  const [storedTags, setStoredTags] = useSynchronizedLocalStorage<string[]>(TAGS_KEY, []);
  const [storedSources, setStoredSources] = useSynchronizedLocalStorage<string[]>(SOURCES_KEY, []);

  const tags = useMemo(() => (Array.isArray(storedTags) ? storedTags : []), [storedTags]);
  const sources = useMemo(
    () => (Array.isArray(storedSources) ? storedSources : []),
    [storedSources]
  );

  // Returns true only when the tag was actually pinned (not a dup / not over the
  // cap), so callers can avoid selecting/clearing on a no-op add. The storage
  // setter broadcasts the value verbatim, so pass a concrete array.
  const addTag = useCallback(
    (raw: string): boolean => {
      const tag = normalizeWaveTag(raw);
      if (!tag) {
        return false;
      }
      const current = readStored(TAGS_KEY);
      if (current.includes(tag) || current.length >= MAX_TAGS) {
        return false;
      }
      setStoredTags([...current, tag]);
      return true;
    },
    [setStoredTags]
  );

  const removeTag = useCallback(
    (tag: string) => {
      setStoredTags(readStored(TAGS_KEY).filter((t) => t !== tag));
    },
    [setStoredTags]
  );

  const addSource = useCallback(
    (host: string): boolean => {
      const value = (host || "").trim().toLowerCase();
      if (!value) {
        return false;
      }
      const current = readStored(SOURCES_KEY);
      if (current.includes(value)) {
        return false;
      }
      setStoredSources([...current, value]);
      return true;
    },
    [setStoredSources]
  );

  const removeSource = useCallback(
    (host: string) => {
      setStoredSources(readStored(SOURCES_KEY).filter((s) => s !== host));
    },
    [setStoredSources]
  );

  return {
    tags,
    sources,
    addTag,
    removeTag,
    addSource,
    removeSource,
    isFull: tags.length >= MAX_TAGS,
    maxTags: MAX_TAGS
  };
}
